/**
 * Standardized API response helper
 */
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static error(res, statusCode, message, errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}

module.exports = ApiResponse;
