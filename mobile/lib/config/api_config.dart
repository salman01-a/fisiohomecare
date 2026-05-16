import 'dart:io' show Platform;

class ApiConfig {
  // Android emulator uses 10.0.2.2 to reach host machine's localhost
  // iOS simulator can use localhost directly
  static String get baseUrl {
    // Both physical devices and emulators on the same network can access the host machine's IP
    // Local IP address of the host machine
    return 'http://192.168.1.9:3001/v1';
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

  // Services
  static const String services = '/services';
  static String serviceById(String id) => '/services/$id';

  // Orders
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String orderStatus(String id) => '/orders/$id/status';

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
}
