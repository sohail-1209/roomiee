// Global error handler middleware — single place for all error responses
const AppError = require('../utils/AppError');

const handlePrismaError = (err) => {
  // Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ');
    return new AppError(`Duplicate value for: ${field}`, 409);
  }
  // Record not found
  if (err.code === 'P2025') {
    return new AppError('Record not found', 404);
  }
  // Foreign key constraint
  if (err.code === 'P2003') {
    return new AppError('Related record not found', 400);
  }
  return new AppError('Database error', 500);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Prisma errors
  if (err.code?.startsWith('P')) {
    error = handlePrismaError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Token expired', 401);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
