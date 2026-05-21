import 'package:dio/dio.dart';

/// Shared utility for extracting human-readable error messages from API responses.
///
/// Handles Sequelize validation errors that return:
/// ```json
/// {
///   "success": false,
///   "message": "Validation error",
///   "errors": [
///     { "field": "name", "message": "Name must be between 2 and 100 characters" }
///   ]
/// }
/// ```
class ErrorHelper {
  /// Extract a user-friendly error message from any exception.
  ///
  /// Priority:
  /// 1. `errors` array field-level messages (joined with newline)
  /// 2. `message` field from response data
  /// 3. Dio error message
  /// 4. Generic fallback
  static String extractMessage(dynamic e) {
    if (e is DioException) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map) {
          // Check for validation errors array with field-level messages
          if (data['errors'] != null && data['errors'] is List && (data['errors'] as List).isNotEmpty) {
            final errors = data['errors'] as List;
            final messages = errors
                .map((err) {
                  if (err is Map && err['message'] != null) {
                    return err['message'].toString();
                  }
                  return err.toString();
                })
                .toList();
            return messages.join('\n');
          }

          // Fall back to top-level message
          if (data['message'] != null) {
            return data['message'].toString();
          }
        }
        return data.toString();
      }
      // Connection/timeout errors
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return 'Koneksi timeout. Periksa jaringan Anda.';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      return e.message ?? 'Terjadi kesalahan koneksi';
    }
    if (e is Exception) {
      return e.toString().replaceFirst('Exception: ', '');
    }
    return e?.toString() ?? 'Terjadi kesalahan';
  }
}
