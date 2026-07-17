function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const requestId = req.headers?.['x-request-id'] || req.headers?.['x-correlation-id'] || 'no-request-id';

  console.error(`${requestId} - [ERROR] ${req.method || 'UNKNOWN'} ${req.originalUrl || req.url || 'unknown route'} status=${statusCode} error=${error.name || 'Error'} message="${error.message}"`);

  return res.status(statusCode).json({
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler };
