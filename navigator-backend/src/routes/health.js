const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'navigator-backend',
    version: '1.0.0',
    ts: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;