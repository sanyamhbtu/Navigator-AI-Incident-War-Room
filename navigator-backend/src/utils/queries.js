// Master incident JOIN query — pulls everything correlated to a triggered incident
const MASTER_INCIDENT_QUERY = `
  SELECT
    i.id                  AS incident_id,
    i.title               AS incident_title,
    i.severity,
    i.status,
    i.created_at,
    i.service_name,
    i.slack_channel_id,
    i.html_url            AS pagerduty_url,

    c.sha                 AS commit_sha,
    c.author              AS commit_author,
    c.message             AS commit_msg,
    c.pushed_at           AS commit_pushed_at,
    c.repository          AS repo,
    c.url                 AS commit_url,

    m.metric_name,
    m.value               AS metric_val,
    m.timestamp           AS metric_ts,
    m.tags                AS metric_tags,

    s.text                AS slack_msg,
    s.user                AS slack_user,
    s.timestamp           AS slack_ts,

    se.id                 AS sentry_issue_id,
    se.title              AS sentry_title,
    se.level              AS sentry_level,
    se.first_seen         AS sentry_first_seen,
    se.times_seen         AS sentry_occurrences,
    se.permalink          AS sentry_url

  FROM pagerduty.incidents i

  LEFT JOIN github.commits c
    ON  c.pushed_at BETWEEN i.created_at - INTERVAL '2h' AND i.created_at
    AND c.repository = i.service_name

  LEFT JOIN datadog.metrics m
    ON  m.timestamp BETWEEN i.created_at - INTERVAL '30m' AND i.created_at + INTERVAL '5m'

  LEFT JOIN slack.messages s
    ON  s.channel   = i.slack_channel_id
    AND s.timestamp BETWEEN i.created_at - INTERVAL '1h' AND i.created_at + INTERVAL '30m'

  LEFT JOIN sentry.issues se
    ON  se.first_seen BETWEEN i.created_at - INTERVAL '2h' AND i.created_at + INTERVAL '10m'

  WHERE i.status = 'triggered'
  ORDER BY i.created_at DESC
`;

// Single-incident deep dive by ID
const INCIDENT_BY_ID_QUERY = (id) => `
  SELECT
    i.id, i.title, i.severity, i.status, i.created_at,
    i.service_name, i.slack_channel_id, i.html_url,
    i.escalation_policy, i.assigned_to,

    c.sha, c.author, c.message AS commit_msg, c.pushed_at, c.repository, c.url AS commit_url,

    m.metric_name, m.value AS metric_val, m.timestamp AS metric_ts, m.tags,

    s.text AS slack_msg, s.user AS slack_user, s.timestamp AS slack_ts,

    se.id AS sentry_id, se.title AS sentry_title, se.level,
    se.first_seen, se.times_seen, se.permalink,
    se.culprit, se.assignee

  FROM pagerduty.incidents i

  LEFT JOIN github.commits c
    ON  c.pushed_at BETWEEN i.created_at - INTERVAL '4h' AND i.created_at + INTERVAL '30m'
    AND c.repository = i.service_name

  LEFT JOIN datadog.metrics m
    ON  m.timestamp BETWEEN i.created_at - INTERVAL '1h' AND i.created_at + INTERVAL '1h'

  LEFT JOIN slack.messages s
    ON  s.channel = i.slack_channel_id
    AND s.timestamp BETWEEN i.created_at - INTERVAL '2h' AND NOW()

  LEFT JOIN sentry.issues se
    ON  se.first_seen BETWEEN i.created_at - INTERVAL '4h' AND i.created_at + INTERVAL '30m'

  WHERE i.id = '${id}'
  LIMIT 1
`;

// Metrics spike query — find anomalies around incident time
const METRICS_SPIKE_QUERY = (serviceName, createdAt) => `
  SELECT
    metric_name,
    MAX(value)  AS peak_value,
    AVG(value)  AS avg_value,
    MIN(value)  AS min_value,
    COUNT(*)    AS data_points
  FROM datadog.metrics
  WHERE tags LIKE '%service:${serviceName}%'
    AND timestamp BETWEEN '${createdAt}'::timestamp - INTERVAL '1h'
                      AND '${createdAt}'::timestamp + INTERVAL '30m'
  GROUP BY metric_name
  ORDER BY peak_value DESC
`;

// Recent commits per repo
const RECENT_COMMITS_QUERY = (repo, hours = 4) => `
  SELECT sha, author, message, pushed_at, url
  FROM github.commits
  WHERE repository = '${repo}'
    AND pushed_at >= NOW() - INTERVAL '${hours}h'
  ORDER BY pushed_at DESC
  LIMIT 20
`;

// Open Sentry issues for a project
const SENTRY_OPEN_ISSUES_QUERY = (project) => `
  SELECT id, title, level, first_seen, last_seen, times_seen, culprit, permalink
  FROM sentry.issues
  WHERE project = '${project}'
    AND status = 'unresolved'
  ORDER BY last_seen DESC
  LIMIT 50
`;

module.exports = {
  MASTER_INCIDENT_QUERY,
  INCIDENT_BY_ID_QUERY,
  METRICS_SPIKE_QUERY,
  RECENT_COMMITS_QUERY,
  SENTRY_OPEN_ISSUES_QUERY
};