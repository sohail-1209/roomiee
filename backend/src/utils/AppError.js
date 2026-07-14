// Custom error class — used everywhere to keep error handling consistent
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
