const router = require('express').Router();
const slackSvc  = require('../services/slack');
const claude    = require('../services/claude');
const pagerduty = require('../services/pagerduty');
const requireApiKey = require('../middleware/auth');

// POST /api/slack/post-brief — post AI brief to Slack for a given incident
router.post('/post-brief', requireApiKey, async (req, res, next) => {
  try {
    const { incident_id, channel } = req.body;
    if (!incident_id) return res.status(400).json({ error: 'incident_id required' });

    const incident = await pagerduty.getIncidentById(incident_id);
    const aiSummary = await claude.generateIncidentBrief({ incident, commits: [], metrics: [], slackMessages: [], sentryIssues: [] });
    const result = await slackSvc.postIncidentBrief(channel || process.env.SLACK_INCIDENT_CHANNEL, incident, aiSummary);

    res.json({ ok: true, ts: result.ts, channel: result.channel });
  } catch (err) {
    next(err);
  }
});

// POST /api/slack/message — raw message post
router.post('/message', requireApiKey, async (req, res, next) => {
  try {
    const { channel, text } = req.body;
    if (!channel || !text) return res.status(400).json({ error: 'channel and text required' });
    const result = await slackSvc.postMessage(channel, text);
    res.json({ ok: true, ts: result.ts });
  } catch (err) {
    next(err);
  }
});

// GET /api/slack/messages/:channelId — fetch recent messages
router.get('/messages/:channelId', requireApiKey, async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { hours = 1 } = req.query;
    const oldest = new Date(Date.now() - hours * 3600 * 1000);
    const messages = await slackSvc.getChannelMessages(channelId, oldest, new Date(), 50);
    res.json({ ok: true, messages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;