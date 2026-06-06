import 'dart:async';
import 'package:flutter/material.dart';
import '../services/nosql_service.dart';
import '../services/local_notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NosqlService _nosqlService = NosqlService();
  final LocalNotificationService _localNotif = LocalNotificationService();

  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  Timer? _pollingTimer;

  // Untuk deteksi notifikasi baru
  int _lastKnownCount = 0;
  String? _lastNotifId;
  int _notifIdCounter = 0; // counter untuk ID notifikasi lokal

  List<Map<String, dynamic>> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  /// Mulai polling notifikasi (panggil setelah login)
  void startPolling() {
    // Init local notification service
    _localNotif.init();

    // Fetch langsung pertama kali
    fetchNotifications();
    // Polling setiap 30 detik
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      fetchNotifications(silent: true);
    });
  }

  /// Stop polling (panggil saat logout)
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    _notifications = [];
    _unreadCount = 0;
    _lastKnownCount = 0;
    _lastNotifId = null;
    notifyListeners();
  }

  /// Callback untuk menampilkan snackbar notifikasi baru
  /// Set dari HomeScreen
  Function(String title, String message)? onNewNotification;

  Future<void> fetchNotifications({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final data = await _nosqlService.getNotifications();
      _notifications = data;
      _unreadCount = data.where((n) => n['is_read'] != true).length;

      // Cek apakah ada notifikasi baru
      if (silent && data.isNotEmpty) {
        final newestId = data.first['id'];
        if (_lastNotifId != null && newestId != _lastNotifId && _unreadCount > _lastKnownCount) {
          // Ada notifikasi baru!
          final newest = data.first;
          final title = newest['title'] ?? 'Notifikasi Baru';
          final message = newest['message'] ?? '';

          // Tampilkan snackbar in-app
          onNewNotification?.call(title, message);

          // Tampilkan juga di notification bar HP (Android/iOS)
          _localNotif.show(
            id: _notifIdCounter++,
            title: title,
            body: message,
          );
        }
        _lastNotifId = newestId;
        _lastKnownCount = _unreadCount;
      } else if (data.isNotEmpty) {
        _lastNotifId = data.first['id'];
        _lastKnownCount = _unreadCount;
      }
    } catch (_) {}

    if (!silent) _isLoading = false;
    notifyListeners();
  }

  Future<void> markAsRead(String notifId, int index) async {
    try {
      await _nosqlService.markAsRead(notifId);
      if (index >= 0 && index < _notifications.length) {
        _notifications[index]['is_read'] = true;
        _unreadCount = _notifications.where((n) => n['is_read'] != true).length;
        notifyListeners();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}
