module.exports = function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }
  next();
};