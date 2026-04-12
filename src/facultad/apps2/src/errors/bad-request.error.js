const { AppError } = require('./app.error');

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

module.exports = { BadRequestError };