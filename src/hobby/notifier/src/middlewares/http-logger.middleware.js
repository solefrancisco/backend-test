const { logger } = require('@notify/utils/logger.util');

function httpLogger(req, res, next) {
  const start = Date.now();

  logger.info({
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    params: req.params
  }, 'HTTP request started');

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    const level =
      res.statusCode >= 500 ? 'error' :
      res.statusCode >= 400 ? 'warn' :
      'info';

    logger[level]({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs
    }, 'HTTP request completed');
  });

  next();
}

module.exports = { httpLogger };