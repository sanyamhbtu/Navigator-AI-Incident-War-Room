// ─────────────────────────────────────────────────────────────────────────────
// /api/investigate/:id — Coral-first incident investigation
//
// The demo story: one PagerDuty incident → 4 Coral SQL queries → AI brief.
// No REST calls into Datadog/GitHub/Sentry/Slack/Linear. Coral does it all.
// ─────────────────────────────────────────────────────────────────────────────

const router = require('express').Router();
const { runCoralQuery } = require('../services/coral');
const {
  MASTER_INCIDENT_QUERY,
  METRICS_DELTA_QUERY,
  SUSPECT_COMMITS_QUERY,
  SIMILAR_PAST_INCIDENTS_QUERY,
} = require('../utils/queries');
const llm = require('../services/llm');
const slackSvc = require('../services/slack');
const linearSvc = require('../services/linear');
const requireApiKey = require('../middleware/auth');
const logger = require('../utils/logger');

// Dedupe array of objects by a key, filtering out rows where that key is null.
// The master JOIN produces row-explosion; this rebuilds clean structured arrays.
function dedupeBy(rows, key) {
  const seen = new Map();
  for (const row of rows) {
    const k = row[key];
    if (k === null || k === undefined || k === '') continue;
    if (!seen.has(k)) seen.set(k, row);
  }
  return Array.from(seen.values());
}

// Pull a single representative copy of the incident fields out of the joined rows.
function extractIncident(rows) {
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.incident_id,
    title: r.incident_title,
    severity: r.severity,
    status: r.status,
    created_at: r.created_at,
    service_name: r.service_name,
    slack_channel_id: r.slack_channel_id,
    html_url: r.pagerduty_url,
    escalation_policy: r.escalation_policy,
    assigned_to: r.assigned_to,
  };
}

// ─── GET /api/investigate/:id ────────────────────────────────────────────────
router.get('/:id', requireApiKey, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { create_linear = 'false', post_slack = 'false' } = req.query;

    logger.info(`[Investigate] Starting Coral-first investigation for ${id}`);

    // ── 1. Master JOIN: PagerDuty + GitHub + Datadog + Slack + Sentry + Linear ──
    const masterRows = await runCoralQuery(MASTER_INCIDENT_QUERY(id));

    if (!masterRows || masterRows.length === 0) {
      return res.status(404).json({ error: `Incident ${id} not found in Coral` });
    }

    const incident = extractIncident(masterRows);
    const serviceName = incident.service_name;
    const createdAt = incident.created_at;

    // ── 2. Three focused Coral queries in parallel ──
    const [metricsDeltaRes, suspectCommitsRes, similarPastRes] = await Promise.allSettled([
      runCoralQuery(METRICS_DELTA_QUERY(serviceName, createdAt)),
      runCoralQuery(SUSPECT_COMMITS_QUERY(serviceName, createdAt, 4)),
      runCoralQuery(SIMILAR_PAST_INCIDENTS_QUERY(serviceName, id)),
    ]);

    const metricsDelta = metricsDeltaRes.status === 'fulfilled' ? metricsDeltaRes.value : [];
    const suspectCommits = suspectCommitsRes.status === 'fulfilled' ? suspectCommitsRes.value : [];
    const similarPastIncidents = similarPastRes.status === 'fulfilled' ? similarPastRes.value : [];

    // ── 3. Dedupe row-explosion from the master JOIN ──
    const commits = dedupeBy(masterRows, 'commit_sha').map((r) => ({
      sha: r.commit_sha,
      author: r.commit_author,
      message: r.commit_msg,
      pushed_at: r.commit_pushed_at,
      repo: r.repo,
      url: r.commit_url,
    }));

    const metrics = dedupeBy(masterRows, 'metric_ts').map((r) => ({
      metric_name: r.metric_name,
      value: r.metric_val,
      timestamp: r.metric_ts,
      tags: r.metric_tags,
    }));

    const slackMessages = dedupeBy(masterRows, 'slack_ts').map((r) => ({
      user: r.slack_user,
      text: r.slack_msg,
      timestamp: r.slack_ts,
    }));

    const sentryIssues = dedupeBy(masterRows, 'sentry_issue_id').map((r) => ({
      id: r.sentry_issue_id,
      title: r.sentry_title,
      level: r.sentry_level,
      first_seen: r.sentry_first_seen,
      times_seen: r.sentry_occurrences,
      culprit: r.sentry_culprit,
      url: r.sentry_url,
    }));

    const linearTickets = dedupeBy(masterRows, 'linear_id').map((r) => ({
      id: r.linear_id,
      title: r.linear_title,
      state: r.linear_state,
      assignee: r.linear_assignee,
      url: r.linear_url,
    }));

    // ── 4. Assemble bundle ──
    const incidentBundle = {
      incident,
      commits,
      metrics,
      metricsDelta,
      suspectCommits,
      slackMessages,
      sentryIssues,
      linearTickets,
      similarPastIncidents,
    };

    // ── 5. Generate AI brief (structured JSON) ──
    const aiSummary = await llm.generateIncidentBrief(incidentBundle);

    // ── 6. Optional side effects ──
    let slackResult = null;
    if (post_slack === 'true') {
      const channel = process.env.SLACK_INCIDENT_CHANNEL || '#incidents';
      try {
        slackResult = await slackSvc.postIncidentBrief(channel, incident, aiSummary);
      } catch (e) {
        logger.warn(`[Investigate] Slack post failed: ${e.message}`);
      }
    }

    let linearIssue = null;
    if (create_linear === 'true') {
      try {
        linearIssue = await linearSvc.createIncidentIssue(incident, aiSummary);
      } catch (e) {
        logger.warn(`[Investigate] Linear creation failed: ${e.message}`);
      }
    }

    res.json({
      ok: true,
      incident_id: id,
      investigation: incidentBundle,
      ai_summary: aiSummary,
      slack: slackResult,
      linear: linearIssue,
      coral_queries_executed: 4,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/investigate/:id/ask — freeform Q&A about the incident ────────
router.post('/:id/ask', requireApiKey, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    const rows = await runCoralQuery(MASTER_INCIDENT_QUERY(req.params.id));
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `Incident ${req.params.id} not found` });
    }
    const incident = extractIncident(rows);

    const answer = await llm.askAboutIncident({ incident }, question);
    res.json({ ok: true, answer });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/investigate/:id/postmortem — markdown postmortem doc ──────────
router.post('/:id/postmortem', requireApiKey, async (req, res, next) => {
  try {
    const { resolution } = req.body;

    const rows = await runCoralQuery(MASTER_INCIDENT_QUERY(req.params.id));
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: `Incident ${req.params.id} not found` });
    }

    const incident = extractIncident(rows);
    const commits = dedupeBy(rows, 'commit_sha').slice(0, 6).map((r) => ({
      sha: r.commit_sha,
      author: r.commit_author,
      message: r.commit_msg,
      pushed_at: r.commit_pushed_at,
    }));
    const metrics = dedupeBy(rows, 'metric_ts').slice(0, 6).map((r) => ({
      metric_name: r.metric_name,
      value: r.metric_val,
    }));
    const sentryIssues = dedupeBy(rows, 'sentry_issue_id').slice(0, 3).map((r) => ({
      title: r.sentry_title,
      level: r.sentry_level,
    }));

    const postmortem = await llm.generatePostmortem(
      { incident, commits, metrics, sentryIssues },
      resolution || 'Resolved'
    );

    res.json({ ok: true, postmortem });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
