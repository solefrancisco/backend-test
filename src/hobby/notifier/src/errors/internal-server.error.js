const { AppError } = require('./app.error');

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

module.exports = { InternalServerError };