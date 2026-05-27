// ─────────────────────────────────────────────────────────────────────────────
// Coral SQL templates — Navigator AI Incident War Room
// One Coral query crosses 6 sources (PagerDuty, GitHub, Datadog, Slack,
// Sentry, Linear). This file is the heart of the project's pitch.
// ─────────────────────────────────────────────────────────────────────────────

// SQL string escape — Coral treats inputs as Postgres-ish. Single-quote any
// scalar interpolated into a WHERE/LIKE clause. Reject anything that's not a
// reasonable identifier so an incident_id can't break out of the query.
function safeStringLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  const str = String(value);
  if (!/^[A-Za-z0-9_\-:/.@]+$/.test(str)) {
    throw new Error(`Unsafe SQL literal: ${str.slice(0, 40)}`);
  }
  return `'${str.replace(/'/g, "''")}'`;
}

// ─── MASTER INCIDENT QUERY ───────────────────────────────────────────────────
// The single query the demo shows on stage.
// Six LEFT JOINs across PagerDuty + GitHub + Datadog + Slack + Sentry + Linear,
// correlated by timestamp window around the incident's created_at.
const MASTER_INCIDENT_QUERY = (id) => `
  SELECT
    -- PagerDuty
    i.id                  AS incident_id,
    i.title               AS incident_title,
    i.severity,
    i.status,
    i.created_at,
    i.service_name,
    i.slack_channel_id,
    i.html_url            AS pagerduty_url,
    i.escalation_policy,
    i.assigned_to,

    -- GitHub
    c.sha                 AS commit_sha,
    c.author              AS commit_author,
    c.message             AS commit_msg,
    c.pushed_at           AS commit_pushed_at,
    c.repository          AS repo,
    c.url                 AS commit_url,

    -- Datadog
    m.metric_name,
    m.value               AS metric_val,
    m.timestamp           AS metric_ts,
    m.tags                AS metric_tags,

    -- Slack
    s.text                AS slack_msg,
    s.user                AS slack_user,
    s.timestamp           AS slack_ts,

    -- Sentry
    se.id                 AS sentry_issue_id,
    se.title              AS sentry_title,
    se.level              AS sentry_level,
    se.first_seen         AS sentry_first_seen,
    se.times_seen         AS sentry_occurrences,
    se.permalink          AS sentry_url,
    se.culprit            AS sentry_culprit,

    -- Linear
    l.id                  AS linear_id,
    l.title               AS linear_title,
    l.state               AS linear_state,
    l.assignee            AS linear_assignee,
    l.url                 AS linear_url

  FROM pagerduty.incidents i

  LEFT JOIN github.commits c
    ON  c.pushed_at BETWEEN i.created_at - INTERVAL '4h' AND i.created_at + INTERVAL '30m'
    AND c.repository = i.service_name

  LEFT JOIN datadog.metrics m
    ON  m.timestamp BETWEEN i.created_at - INTERVAL '1h' AND i.created_at + INTERVAL '1h'
    AND m.tags LIKE '%service:' || i.service_name || '%'

  LEFT JOIN slack.messages s
    ON  s.channel = i.slack_channel_id
    AND s.timestamp BETWEEN i.created_at - INTERVAL '2h' AND NOW()

  LEFT JOIN sentry.issues se
    ON  se.first_seen BETWEEN i.created_at - INTERVAL '4h' AND i.created_at + INTERVAL '30m'
    AND se.project = i.service_name

  LEFT JOIN linear.issues l
    ON  l.title ILIKE '%' || i.service_name || '%'
    AND l.state != 'completed'

  WHERE i.id = ${safeStringLiteral(id)}
  LIMIT 200
`;

// Active triggered incidents — the live feed
const ACTIVE_INCIDENTS_QUERY = (limit = 20) => `
  SELECT
    id,
    title,
    severity,
    status,
    created_at,
    service_name,
    slack_channel_id,
    html_url
  FROM pagerduty.incidents
  WHERE status = 'triggered'
  ORDER BY created_at DESC
  LIMIT ${Number.isInteger(limit) ? limit : 20}
`;

// Metric delta around the incident — gives Claude "300x spike" framing
// instead of just raw values. Computes peak vs. baseline.
const METRICS_DELTA_QUERY = (serviceName, createdAt) => `
  SELECT
    metric_name,
    MAX(value)  AS peak_value,
    AVG(value)  AS avg_value,
    MIN(value)  AS min_value,
    COUNT(*)    AS data_points
  FROM datadog.metrics
  WHERE tags LIKE '%service:' || ${safeStringLiteral(serviceName)} || '%'
    AND timestamp BETWEEN ${safeStringLiteral(createdAt)}::timestamp - INTERVAL '1h'
                      AND ${safeStringLiteral(createdAt)}::timestamp + INTERVAL '30m'
  GROUP BY metric_name
  ORDER BY peak_value DESC
  LIMIT 20
`;

// Suspect commits — ranked by recency within a tight pre-incident window.
// The top row is almost always the prime root-cause suspect.
const SUSPECT_COMMITS_QUERY = (serviceName, createdAt, hours = 4) => `
  SELECT
    sha,
    author,
    message,
    pushed_at,
    url,
    EXTRACT(EPOCH FROM (${safeStringLiteral(createdAt)}::timestamp - pushed_at)) / 60
                                          AS minutes_before_incident
  FROM github.commits
  WHERE repository = ${safeStringLiteral(serviceName)}
    AND pushed_at BETWEEN ${safeStringLiteral(createdAt)}::timestamp - INTERVAL '${Number(hours)}h'
                      AND ${safeStringLiteral(createdAt)}::timestamp
  ORDER BY pushed_at DESC
  LIMIT 10
`;

// Past-incident similarity — Navigator's "this looks like INC-0042" feature.
// Finds resolved incidents on the same service in the last 90 days.
const SIMILAR_PAST_INCIDENTS_QUERY = (serviceName, excludeId) => `
  SELECT
    i.id,
    i.title,
    i.severity,
    i.created_at,
    i.resolved_at,
    l.title       AS linear_title,
    l.url         AS linear_url
  FROM pagerduty.incidents i
  LEFT JOIN linear.issues l
    ON  l.title ILIKE '%' || i.id || '%'
  WHERE i.service_name = ${safeStringLiteral(serviceName)}
    AND i.status = 'resolved'
    AND i.id != ${safeStringLiteral(excludeId)}
    AND i.created_at >= NOW() - INTERVAL '90 days'
  ORDER BY i.created_at DESC
  LIMIT 5
`;

// Sentry open issues for a project — used by /api/incidents enrichment
const SENTRY_OPEN_ISSUES_QUERY = (project) => `
  SELECT id, title, level, first_seen, last_seen, times_seen, culprit, permalink
  FROM sentry.issues
  WHERE project = ${safeStringLiteral(project)}
    AND status = 'unresolved'
  ORDER BY last_seen DESC
  LIMIT 50
`;

module.exports = {
  MASTER_INCIDENT_QUERY,
  ACTIVE_INCIDENTS_QUERY,
  METRICS_DELTA_QUERY,
  SUSPECT_COMMITS_QUERY,
  SIMILAR_PAST_INCIDENTS_QUERY,
  SENTRY_OPEN_ISSUES_QUERY,
  safeStringLiteral,
};
