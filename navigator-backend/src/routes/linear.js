const router = require('express').Router();
const linearSvc = require('../services/linear');
const requireApiKey = require('../middleware/auth');

// GET /api/linear/issues — get open issues
router.get('/issues', requireApiKey, async (req, res, next) => {
  try {
    const issues = await linearSvc.getOpenIssues(50);
    res.json({ ok: true, issues });
  } catch (err) { next(err); }
});

// POST /api/linear/issues — create issue manually
router.post('/issues', requireApiKey, async (req, res, next) => {
  try {
    const { incident, aiSummary } = req.body;
    const issue = await linearSvc.createIncidentIssue(incident, aiSummary);
    res.json({ ok: true, issue });
  } catch (err) { next(err); }
});

// PATCH /api/linear/issues/:id/status — update status
router.patch('/issues/:id/status', requireApiKey, async (req, res, next) => {
  try {
    const result = await linearSvc.updateIssueStatus(req.params.id, req.body.status);
    res.json({ ok: true, result });
  } catch (err) { next(err); }
});

// POST /api/linear/issues/:id/comment — add comment
router.post('/issues/:id/comment', requireApiKey, async (req, res, next) => {
  try {
    const result = await linearSvc.addComment(req.params.id, req.body.body);
    res.json({ ok: true, result });
  } catch (err) { next(err); }
});

module.exports = router;