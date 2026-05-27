import 'dart:io' show Platform;
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  // Android emulator uses 10.0.2.2 to reach host machine's localhost
  // iOS simulator can use localhost directly
  static String get baseUrl {
    // Both physical devices and emulators on the same network can access the host machine's IP
    // Local IP address of the host machine
    return 'http://192.168.100.11:3001/v1';
  }

  static const String _serverBase = 'http://192.168.100.11:3001';

  static String getImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('/uploads')) {
      return '$_serverBase$url';
    }
    // GCS URLs → proxy melalui backend (karena GCS tidak public)
    if (url.startsWith('https://storage.googleapis.com/') ||
        url.startsWith('https://firebasestorage.googleapis.com/')) {
      return '$_serverBase/v1/upload/image?url=${Uri.encodeComponent(url)}';
    }
    return url;
  }

  /// Build image URL with token (untuk Image.network headers atau query param)
  static Future<String> getImageUrlWithToken(String? url) async {
    final baseImgUrl = getImageUrl(url);
    if (baseImgUrl.isEmpty) return '';
    // Jika sudah proxy URL, tambahkan token
    if (baseImgUrl.contains('/v1/upload/image?')) {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';
      return '$baseImgUrl&token=$token';
    }
    return baseImgUrl;
  }

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';

  // Patient (self-service for mobile)
  static const String patientMe = '/patients/me';
  static const String patientMyOrders = '/patients/me/orders';
  static const String patientMyRecords = '/patients/me/records';

  // Therapists
  static const String therapists = '/therapists';
  static String therapistById(String id) => '/therapists/$id';
  static String therapistSchedules(String id) => '/therapists/$id/schedules';
  static String therapistReviews(String id) => '/therapists/$id/reviews';

  // Services
  static const String services = '/services';
  static String serviceById(String id) => '/services/$id';

  // Orders
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String orderStatus(String id) => '/orders/$id/status';
  static String orderRate(String id) => '/orders/$id/rate';

  // Payments
  static const String paymentInitiate = '/payments/initiate';
  static String paymentByOrderId(String orderId) => '/payments/$orderId';
  static String paymentConfirm(String orderId) => '/payments/$orderId/confirm';

  // Records
  static const String records = '/records';
  static String recordById(String id) => '/records/$id';
  static String patientRecords(String patientId) =>
      '/patients/$patientId/records';

  // Upload
  static const String uploadPayment = '/upload/payment';
  static const String uploadPhoto = '/upload/photo';
  static const String uploadDocument = '/upload/document';
  static const String uploadPhotos = '/upload/photos';

  // NoSQL (Firestore) — Visit Tracking
  static String visitTracking(String orderId) => '/nosql/tracking/$orderId';

  // NoSQL (Firestore) — Patient Notifications
  static const String notifications = '/nosql/notifications';
  static String markNotificationRead(String notifId) =>
      '/nosql/notifications/$notifId/read';

  // NoSQL (Firestore) — Activity Logs
  static const String myActivityLogs = '/nosql/my-activity-logs';
}
