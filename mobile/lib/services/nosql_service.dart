import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_client.dart';

/// Service untuk operasi NoSQL (Firestore) dari sisi mobile
/// Sesuai requirement: tracking kunjungan & notifikasi pasien
class NosqlService {
  final Dio _dio = ApiClient().dio;

  // ============ Visit Tracking ============

  /// Get visit tracking untuk suatu order
  Future<Map<String, dynamic>?> getVisitTracking(String orderId) async {
    try {
      final response = await _dio.get(ApiConfig.visitTracking(orderId));
      return response.data['data'] as Map<String, dynamic>?;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  // ============ Notifications ============

  /// Get semua notifikasi pasien
  Future<List<Map<String, dynamic>>> getNotifications() async {
    final response = await _dio.get(ApiConfig.notifications);
    final List data = response.data['data'] ?? [];
    return data.cast<Map<String, dynamic>>();
  }

  /// Tandai notifikasi sudah dibaca
  Future<void> markAsRead(String notifId) async {
    await _dio.put(ApiConfig.markNotificationRead(notifId));
  }

  // ============ Activity Logs ============

  /// Get activity logs milik user yang login
  Future<List<Map<String, dynamic>>> getMyActivityLogs() async {
    final response = await _dio.get(ApiConfig.myActivityLogs);
    final List data = response.data['data'] ?? [];
    return data.cast<Map<String, dynamic>>();
  }
}
