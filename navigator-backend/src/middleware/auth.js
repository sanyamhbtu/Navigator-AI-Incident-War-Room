// Simple x-api-key middleware.
// Defaults INTERNAL_API_KEY to 'dev-key' so the hackathon demo works without
// env setup. Set INTERNAL_API_KEY in production.

const logger = require('../utils/logger');

const EXPECTED = process.env.INTERNAL_API_KEY || 'dev-key';

if (!process.env.INTERNAL_API_KEY) {
  logger.warn(
    '[auth] INTERNAL_API_KEY not set, defaulting to "dev-key". Set this in production.'
  );
}

module.exports = function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== EXPECTED) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }
  next();
};
