const router = require('express').Router();
const pagerduty = require('../services/pagerduty');
const datadog   = require('../services/datadog');
const sentry    = require('../services/sentry');
const { runCoralQuery } = require('../services/coral');
const { ACTIVE_INCIDENTS_QUERY } = require('../utils/queries');
const requireApiKey = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/incidents — all active incidents (Coral primary, REST as live overlay)
router.get('/', requireApiKey, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    // Coral is the primary source; REST fetches stay as a live-data overlay
    // for the war-room dashboard (monitors/sentry that aren't yet Coral'd).
    const [coralRows, liveIncidents, alertingMonitors, spikingErrors] = await Promise.all([
      runCoralQuery(ACTIVE_INCIDENTS_QUERY(limit)).catch(e => {
        logger.warn('Coral query failed, falling back: ' + e.message);
        return [];
      }),
      pagerduty.getTriggeredIncidents().catch(() => []),
      datadog.getAlertingMonitors().catch(() => []),
      sentry.getSpikingIssues(30).catch(() => [])
    ]);

    res.json({
      ok: true,
      ts: new Date().toISOString(),
      coral: coralRows,
      live: {
        incidents: liveIncidents,
        monitors: alertingMonitors,
        sentry: spikingErrors
      },
      counts: {
        incidents: liveIncidents.length,
        monitors: alertingMonitors.length,
        sentry: spikingErrors.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id — single incident summary
router.get('/:id', requireApiKey, async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await pagerduty.getIncidentById(id);
    const [alerts, log, notes] = await Promise.all([
      pagerduty.getIncidentAlerts(id),
      pagerduty.getIncidentLog(id),
      pagerduty.getIncidentNotes(id)
    ]);
    res.json({ ok: true, incident, alerts, log, notes });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/acknowledge
router.post('/:id/acknowledge', requireApiKey, async (req, res, next) => {
  try {
    const result = await pagerduty.acknowledgeIncident(req.params.id, req.body.email);
    res.json({ ok: true, incident: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/resolve
router.post('/:id/resolve', requireApiKey, async (req, res, next) => {
  try {
    const result = await pagerduty.resolveIncident(req.params.id, req.body.email);
    res.json({ ok: true, incident: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;