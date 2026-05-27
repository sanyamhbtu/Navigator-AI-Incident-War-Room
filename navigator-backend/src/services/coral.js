// ─────────────────────────────────────────────────────────────────────────────
// Coral service — dual-mode.
//
// FIXTURES MODE (default) — recognises query intent from the SQL and returns
//   pre-baked realistic data. Zero credentials, zero CLI install, demo-safe.
//
// LIVE MODE (CORAL_LIVE=true) — shells out to the real `coral` CLI binary.
//
// Pitch: the backend code path is identical in both modes. Same SQL queries,
// same dedupe logic, same row shapes. Coral is the abstraction layer; what
// resolves the abstraction is swappable.
// ─────────────────────────────────────────────────────────────────────────────

const { exec } = require('child_process');
const logger = require('../utils/logger');
const fixtures = require('../fixtures/sample-data');

const LIVE_MODE = process.env.CORAL_LIVE === 'true';

if (LIVE_MODE) {
  logger.info('[Coral] LIVE mode — shelling out to `coral sql` CLI');
} else {
  logger.info('[Coral] FIXTURES mode — set CORAL_LIVE=true to use real Coral');
}

// ─── LIVE MODE: real CLI ─────────────────────────────────────────────────────

function runLiveQuery(sql) {
  return new Promise((resolve, reject) => {
    const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `coral sql "${escaped}" --output json`;
    logger.info(`[Coral·live] ${sql.slice(0, 80)}...`);

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        logger.error(`[Coral·live] CLI error: ${stderr || err.message}`);
        return reject(new Error(`Coral query failed: ${stderr || err.message}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseErr) {
        reject(new Error(`Coral JSON parse: ${parseErr.message}`));
      }
    });
  });
}

// ─── FIXTURES MODE: dispatch by SQL pattern ──────────────────────────────────

function runFixtureQuery(sql) {
  logger.info(`[Coral·fixtures] ${sql.slice(0, 80).replace(/\s+/g, ' ')}...`);

  // ACTIVE_INCIDENTS_QUERY — pagerduty.incidents WHERE status='triggered'
  if (/FROM\s+pagerduty\.incidents\s+WHERE\s+status\s*=\s*'triggered'/i.test(sql)) {
    return fixtures.ACTIVE_INCIDENTS;
  }

  // MASTER_INCIDENT_QUERY — pulls one incident by id with all JOINs
  const masterMatch = sql.match(/WHERE\s+i\.id\s*=\s*'([^']+)'/i);
  if (
    masterMatch &&
    /pagerduty\.incidents/i.test(sql) &&
    /LEFT JOIN\s+github\.commits/i.test(sql)
  ) {
    const id = masterMatch[1];
    return fixtures.INCIDENT_DATA[id]?.masterRows || [];
  }

  // METRICS_DELTA_QUERY — aggregated peak/avg/min by metric
  if (
    /FROM\s+datadog\.metrics/i.test(sql) &&
    /MAX\(value\)\s+AS\s+peak_value/i.test(sql)
  ) {
    const serviceMatch = sql.match(/service:([A-Za-z0-9_\-]+)/);
    const service = serviceMatch?.[1];
    const incidentId = inferIncidentByService(service);
    return incidentId ? fixtures.INCIDENT_DATA[incidentId].metricsDelta : [];
  }

  // SUSPECT_COMMITS_QUERY — github.commits with minutes_before_incident
  if (
    /FROM\s+github\.commits/i.test(sql) &&
    /minutes_before_incident/i.test(sql)
  ) {
    const repoMatch = sql.match(/repository\s*=\s*'([^']+)'/i);
    const service = repoMatch?.[1];
    const incidentId = inferIncidentByService(service);
    return incidentId ? fixtures.INCIDENT_DATA[incidentId].suspectCommits : [];
  }

  // SIMILAR_PAST_INCIDENTS_QUERY — resolved incidents on same service
  if (
    /pagerduty\.incidents[\s\S]*status\s*=\s*'resolved'/i.test(sql) &&
    /service_name\s*=\s*'/i.test(sql)
  ) {
    const svcMatch = sql.match(/service_name\s*=\s*'([^']+)'/i);
    const service = svcMatch?.[1];
    const incidentId = inferIncidentByService(service);
    return incidentId ? fixtures.INCIDENT_DATA[incidentId].similarPast : [];
  }

  // SENTRY_OPEN_ISSUES_QUERY — not currently called by routes, but support it
  if (/FROM\s+sentry\.issues/i.test(sql) && /status\s*=\s*'unresolved'/i.test(sql)) {
    return [];
  }

  logger.warn(`[Coral·fixtures] no dispatch rule matched, returning empty`);
  return [];
}

function inferIncidentByService(service) {
  if (!service) return null;
  const found = fixtures.ACTIVE_INCIDENTS.find((i) => i.service_name === service);
  return found?.id || null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function runCoralQuery(sql) {
  if (LIVE_MODE) return runLiveQuery(sql);
  return runFixtureQuery(sql);
}

async function runCoralQueries(queries) {
  return Promise.all(
    queries.map(({ name, sql }) =>
      runCoralQuery(sql)
        .then((data) => ({ name, data, ok: true }))
        .catch((err) => ({ name, error: err.message, ok: false }))
    )
  );
}

module.exports = { runCoralQuery, runCoralQueries, LIVE_MODE };
