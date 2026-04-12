function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler };