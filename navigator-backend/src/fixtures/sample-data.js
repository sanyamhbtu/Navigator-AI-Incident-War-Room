// ─────────────────────────────────────────────────────────────────────────────
// Demo fixtures — realistic data shaped exactly like what real Coral would
// return for each query. Used when CORAL_LIVE !== 'true' (the default).
//
// The point: the backend code path stays identical (same SQL queries, same
// row shapes, same dedupe logic). We just don't shell out to a Coral binary.
//
// Three incidents at varying severity, each with its own:
//   - master JOIN rows (with realistic row-explosion from the LEFT JOINs)
//   - metrics delta aggregates
//   - suspect commits ranked by recency
//   - similar past incidents
// ─────────────────────────────────────────────────────────────────────────────

// Helpers — produce ISO timestamps relative to "now" so the fixture feels live
const now = () => Date.now();
const ago = (mins) => new Date(now() - mins * 60 * 1000).toISOString();

// ─── ACTIVE INCIDENTS (list endpoint) ────────────────────────────────────────

const ACTIVE_INCIDENTS = [
  {
    id: 'INC-042',
    title: 'payments-api 5xx error rate spike',
    severity: 'P1',
    status: 'triggered',
    created_at: ago(14),
    service_name: 'payments-api',
    slack_channel_id: 'C0123ABCD',
    html_url: 'https://pagerduty.example/incidents/INC-042',
  },
  {
    id: 'INC-041',
    title: 'auth-svc login latency degraded',
    severity: 'P2',
    status: 'triggered',
    created_at: ago(36),
    service_name: 'auth-svc',
    slack_channel_id: 'C0456EFGH',
    html_url: 'https://pagerduty.example/incidents/INC-041',
  },
  {
    id: 'INC-040',
    title: 'search-api p99 above SLO',
    severity: 'P3',
    status: 'triggered',
    created_at: ago(134),
    service_name: 'search-api',
    slack_channel_id: 'C0789IJKL',
    html_url: 'https://pagerduty.example/incidents/INC-040',
  },
];

// ─── PER-INCIDENT DATA ───────────────────────────────────────────────────────

const INCIDENT_DATA = {
  'INC-042': {
    masterRows: buildMasterRows(ACTIVE_INCIDENTS[0], {
      commits: [
        { sha: 'a8f2c39', author: 'rahul', msg: 'refactor: simplify stripe webhook handler', pushed_at: ago(19) },
        { sha: '7b1d4f2', author: 'priya', msg: 'bump @stripe/sdk to 14.2.0', pushed_at: ago(62) },
        { sha: '3c9e8a1', author: 'rahul', msg: 'add retry middleware for outbound webhooks', pushed_at: ago(110) },
      ],
      metrics: [
        { name: 'http.5xx_rate', value: 47.3, ts: ago(8) },
        { name: 'http.5xx_rate', value: 0.1, ts: ago(20) },
        { name: 'stripe.webhook.failure', value: 2847, ts: ago(8) },
        { name: 'checkout.success_rate', value: 12.1, ts: ago(8) },
      ],
      slackMessages: [
        { user: 'priya', text: 'anyone seeing 500s on payments?', ts: ago(12) },
        { user: 'rahul', text: 'just pushed a webhook refactor — let me look', ts: ago(11) },
        { user: 'ops-bot', text: '🚨 PagerDuty: payments-api P1 triggered', ts: ago(14) },
      ],
      sentryIssues: [
        { id: 'sent_001', title: 'StripeSignatureError: invalid_signature', level: 'fatal', first_seen: ago(8), times_seen: 2847, culprit: 'src/webhooks/stripe.ts:42', url: 'https://sentry.io/sent_001' },
        { id: 'sent_002', title: 'WebhookTimeout: 30s exceeded', level: 'error', first_seen: ago(7), times_seen: 412, culprit: 'src/webhooks/stripe.ts:78', url: 'https://sentry.io/sent_002' },
      ],
      linearTickets: [
        { id: 'LIN-301', title: 'Stripe webhooks intermittent failures', state: 'in_progress', assignee: 'rahul', url: 'https://linear.app/LIN-301' },
      ],
    }),
    metricsDelta: [
      { metric_name: 'http.5xx_rate', peak_value: 47.3, avg_value: 0.18, min_value: 0.1, data_points: 84 },
      { metric_name: 'stripe.webhook.failure', peak_value: 2847, avg_value: 0, min_value: 0, data_points: 84 },
      { metric_name: 'checkout.success_rate', peak_value: 12.1, avg_value: 98.7, min_value: 12.1, data_points: 84 },
    ],
    suspectCommits: [
      { sha: 'a8f2c39', author: 'rahul', message: 'refactor: simplify stripe webhook handler', pushed_at: ago(19), url: 'https://github.example/c/a8f2c39', minutes_before_incident: 5 },
      { sha: '7b1d4f2', author: 'priya', message: 'bump @stripe/sdk to 14.2.0', pushed_at: ago(62), url: 'https://github.example/c/7b1d4f2', minutes_before_incident: 48 },
      { sha: '3c9e8a1', author: 'rahul', message: 'add retry middleware for outbound webhooks', pushed_at: ago(110), url: 'https://github.example/c/3c9e8a1', minutes_before_incident: 96 },
    ],
    similarPast: [
      { id: 'INC-0029', title: 'payments-api stripe webhook signature errors', severity: 'P1', created_at: ago(60 * 24 * 78), resolved_at: ago(60 * 24 * 78 - 42), linear_title: 'Postmortem · stripe webhook signature', linear_url: 'https://linear.app/LIN-119' },
    ],
  },

  'INC-041': {
    masterRows: buildMasterRows(ACTIVE_INCIDENTS[1], {
      commits: [
        { sha: 'd4e8a17', author: 'naveen', msg: 'auth-svc: switch to bcrypt cost factor 14', pushed_at: ago(48) },
        { sha: '9bc12fa', author: 'meera', msg: 'add JWT refresh path', pushed_at: ago(140) },
      ],
      metrics: [
        { name: 'auth.login.p99_ms', value: 4280, ts: ago(28) },
        { name: 'auth.login.p99_ms', value: 380, ts: ago(60) },
        { name: 'auth.login.rate', value: 124, ts: ago(28) },
      ],
      slackMessages: [
        { user: 'meera', text: 'login feels slow on staging too', ts: ago(35) },
        { user: 'naveen', text: 'looking — i bumped bcrypt cost an hour ago, could be it', ts: ago(31) },
      ],
      sentryIssues: [
        { id: 'sent_010', title: 'AuthTimeout: bcrypt.compare exceeded 3s', level: 'warning', first_seen: ago(28), times_seen: 124, culprit: 'src/auth/login.ts:88', url: 'https://sentry.io/sent_010' },
      ],
      linearTickets: [],
    }),
    metricsDelta: [
      { metric_name: 'auth.login.p99_ms', peak_value: 4280, avg_value: 412, min_value: 380, data_points: 60 },
      { metric_name: 'auth.login.rate', peak_value: 124, avg_value: 26, min_value: 18, data_points: 60 },
    ],
    suspectCommits: [
      { sha: 'd4e8a17', author: 'naveen', message: 'auth-svc: switch to bcrypt cost factor 14', pushed_at: ago(48), url: 'https://github.example/c/d4e8a17', minutes_before_incident: 12 },
      { sha: '9bc12fa', author: 'meera', message: 'add JWT refresh path', pushed_at: ago(140), url: 'https://github.example/c/9bc12fa', minutes_before_incident: 104 },
    ],
    similarPast: [],
  },

  'INC-040': {
    masterRows: buildMasterRows(ACTIVE_INCIDENTS[2], {
      commits: [
        { sha: 'f12bca8', author: 'arjun', msg: 'search: bump max result window to 10k', pushed_at: ago(180) },
      ],
      metrics: [
        { name: 'search.query.p99_ms', value: 2840, ts: ago(120) },
        { name: 'search.query.p99_ms', value: 480, ts: ago(180) },
      ],
      slackMessages: [
        { user: 'arjun', text: 'search getting slower, not yet over SLO', ts: ago(140) },
      ],
      sentryIssues: [],
      linearTickets: [
        { id: 'LIN-298', title: 'Investigate search latency drift', state: 'todo', assignee: 'arjun', url: 'https://linear.app/LIN-298' },
      ],
    }),
    metricsDelta: [
      { metric_name: 'search.query.p99_ms', peak_value: 2840, avg_value: 720, min_value: 480, data_points: 200 },
    ],
    suspectCommits: [
      { sha: 'f12bca8', author: 'arjun', message: 'search: bump max result window to 10k', pushed_at: ago(180), url: 'https://github.example/c/f12bca8', minutes_before_incident: 46 },
    ],
    similarPast: [],
  },
};

// ─── Row-explosion builder ───────────────────────────────────────────────────
// Real Coral returns one row per (commit × metric × slack × sentry × linear)
// combination. The route's dedupeBy() step strips duplicates. We reproduce that
// shape so the backend code is exercised identically.

function buildMasterRows(incident, { commits, metrics, slackMessages, sentryIssues, linearTickets }) {
  const rows = [];
  const incidentFields = {
    incident_id: incident.id,
    incident_title: incident.title,
    severity: incident.severity,
    status: incident.status,
    created_at: incident.created_at,
    service_name: incident.service_name,
    slack_channel_id: incident.slack_channel_id,
    pagerduty_url: incident.html_url,
    escalation_policy: 'default',
    assigned_to: 'oncall',
  };

  const commitChunks = commits.length ? commits : [{}];
  const metricChunks = metrics.length ? metrics : [{}];
  const slackChunks = slackMessages.length ? slackMessages : [{}];
  const sentryChunks = sentryIssues.length ? sentryIssues : [{}];
  const linearChunks = linearTickets.length ? linearTickets : [{}];

  for (const c of commitChunks) {
    for (const m of metricChunks) {
      for (const s of slackChunks) {
        for (const se of sentryChunks) {
          for (const l of linearChunks) {
            rows.push({
              ...incidentFields,
              commit_sha: c.sha || null,
              commit_author: c.author || null,
              commit_msg: c.msg || null,
              commit_pushed_at: c.pushed_at || null,
              repo: incident.service_name,
              commit_url: c.sha ? `https://github.example/c/${c.sha}` : null,
              metric_name: m.name || null,
              metric_val: typeof m.value === 'number' ? m.value : null,
              metric_ts: m.ts || null,
              metric_tags: m.name ? `service:${incident.service_name}` : null,
              slack_msg: s.text || null,
              slack_user: s.user || null,
              slack_ts: s.ts || null,
              sentry_issue_id: se.id || null,
              sentry_title: se.title || null,
              sentry_level: se.level || null,
              sentry_first_seen: se.first_seen || null,
              sentry_occurrences: typeof se.times_seen === 'number' ? se.times_seen : null,
              sentry_url: se.url || null,
              sentry_culprit: se.culprit || null,
              linear_id: l.id || null,
              linear_title: l.title || null,
              linear_state: l.state || null,
              linear_assignee: l.assignee || null,
              linear_url: l.url || null,
            });
          }
        }
      }
    }
  }
  return rows;
}

module.exports = {
  ACTIVE_INCIDENTS,
  INCIDENT_DATA,
};
