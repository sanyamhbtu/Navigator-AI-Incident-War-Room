const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, next) {
  logger.error(`${err.status || 500} — ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};