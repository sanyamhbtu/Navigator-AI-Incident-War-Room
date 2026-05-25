const router = require('express').Router();
const { runCoralQuery } = require('../services/coral');
const { INCIDENT_BY_ID_QUERY, METRICS_SPIKE_QUERY, RECENT_COMMITS_QUERY } = require('../utils/queries');
const pagerduty  = require('../services/pagerduty');
const datadog    = require('../services/datadog');
const github     = require('../services/github');
const sentry     = require('../services/sentry');
const slackSvc   = require('../services/slack');
const claude     = require('../services/claude');
const linearSvc  = require('../services/linear');
const requireApiKey = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/investigate/:id — full correlated investigation for one incident
router.get('/:id', requireApiKey, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { create_linear = 'false', post_slack = 'false' } = req.query;

    logger.info(`[Investigate] Starting full investigation for incident ${id}`);

    // 1. Fetch base incident from PagerDuty
    const incident = await pagerduty.getIncidentById(id);
    const serviceName = incident.service?.name || incident.service_name || 'unknown';
    const createdAt = incident.created_at;

    // 2. Run all data fetches in parallel
    const [
      coralRows,
      ddMetrics,
      ghCommits,
      ghWorkflows,
      sentryIssues,
      ddEvents,
      ddLogs
    ] = await Promise.allSettled([
      runCoralQuery(INCIDENT_BY_ID_QUERY(id)).catch(() => []),
      datadog.getServiceMetrics(serviceName, 60),
      github.getRecentCommits(serviceName, 4).catch(() => []),
      github.getWorkflowRuns(serviceName).catch(() => []),
      sentry.getSpikingIssues(60),
      datadog.getEvents(
        new Date(createdAt).getTime() - 2 * 3600 * 1000,
        new Date(createdAt).getTime() + 30 * 60 * 1000,
        `service:${serviceName}`
      ).catch(() => []),
      datadog.getLogs(
        `service:${serviceName} status:error`,
        new Date(createdAt).getTime() - 30 * 60 * 1000,
        new Date(createdAt).getTime() + 10 * 60 * 1000,
        50
      ).catch(() => [])
    ]);

    const commits      = ghCommits.status === 'fulfilled'   ? ghCommits.value      : [];
    const metrics      = ddMetrics.status === 'fulfilled'   ? [ddMetrics.value]    : [];
    const sentry_issues = sentryIssues.status === 'fulfilled' ? sentryIssues.value : [];
    const events       = ddEvents.status === 'fulfilled'    ? ddEvents.value       : [];
    const logs         = ddLogs.status === 'fulfilled'      ? ddLogs.value         : [];
    const workflows    = ghWorkflows.status === 'fulfilled' ? ghWorkflows.value    : [];
    const coral        = coralRows.status === 'fulfilled'   ? coralRows.value      : [];

    // 3. Get Slack messages for the incident channel
    let slackMessages = [];
    if (incident.slack_channel_id) {
      try {
        slackMessages = await slackSvc.getChannelMessages(
          incident.slack_channel_id,
          new Date(createdAt).getTime() - 3600 * 1000,
          Date.now(),
          30
        );
      } catch (e) {
        logger.warn('Slack fetch failed: ' + e.message);
      }
    }

    const incidentBundle = {
      incident,
      commits,
      metrics,
      slackMessages,
      sentryIssues: sentry_issues,
      events,
      logs,
      workflows,
      coral
    };

    // 4. Generate AI brief
    const aiSummary = await claude.generateIncidentBrief(incidentBundle);

    // 5. Optionally post to Slack
    let slackResult = null;
    if (post_slack === 'true') {
      const channel = process.env.SLACK_INCIDENT_CHANNEL || '#incidents';
      slackResult = await slackSvc.postIncidentBrief(channel, incident, aiSummary);
    }

    // 6. Optionally create Linear issue
    let linearIssue = null;
    if (create_linear === 'true') {
      linearIssue = await linearSvc.createIncidentIssue(incident, aiSummary);
    }

    res.json({
      ok: true,
      incident_id: id,
      investigation: incidentBundle,
      ai_summary: aiSummary,
      slack: slackResult,
      linear: linearIssue,
      ts: new Date().toISOString()
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/investigate/:id/ask — ask Claude a question about this incident
router.post('/:id/ask', requireApiKey, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    const incident = await pagerduty.getIncidentById(req.params.id);
    const answer = await claude.askAboutIncident({ incident }, question);
    res.json({ ok: true, answer });
  } catch (err) {
    next(err);
  }
});

// POST /api/investigate/:id/postmortem — generate postmortem
router.post('/:id/postmortem', requireApiKey, async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const incident = await pagerduty.getIncidentById(req.params.id);
    const commits = await github.getRecentCommits(incident.service?.name || '', 6).catch(() => []);
    const postmortem = await claude.generatePostmortem({ incident, commits }, resolution || 'Resolved');
    res.json({ ok: true, postmortem });
  } catch (err) {
    next(err);
  }
});

module.exports = router;