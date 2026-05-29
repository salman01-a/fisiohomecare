const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Middleware to check express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return ApiResponse.error(res, 400, 'Validation error', formattedErrors);
  }
  next();
};

module.exports = validate;
