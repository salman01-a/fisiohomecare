const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, 400, 'Validation error', errors);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, 409, 'Duplicate entry', errors);
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.error(res, 400, 'Referenced resource does not exist');
  }

  // Custom ApiError
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.errors);
  }

  // Default server error
  return ApiResponse.error(
    res,
    500,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  );
};

module.exports = errorHandler;
