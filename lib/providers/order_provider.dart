import 'dart:async';
import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/order_service.dart';
import '../utils/error_helper.dart';

class OrderProvider extends ChangeNotifier {
  final OrderService _service = OrderService();

  List<Order> _orders = [];
  Order? _selectedOrder;
  bool _isLoading = false;
  String? _error;

  Timer? _pollingTimer;
  bool _isPolling = false;

  List<Order> get orders => _orders;
  Order? get selectedOrder => _selectedOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isPolling => _isPolling;

  /// Fetch all patient orders
  Future<void> fetchOrders({String? status}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _orders = await _service.getAll(status: status);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = ErrorHelper.extractMessage(e);
      notifyListeners();
    }
  }

  /// Silently refresh orders without showing loading indicator (for live updates)
  Future<void> silentRefreshOrders({String? status}) async {
    try {
      final freshOrders = await _service.getAll(status: status);

      // Check if any status actually changed
      bool hasChanges = false;
      if (freshOrders.length != _orders.length) {
        hasChanges = true;
      } else {
        for (int i = 0; i < freshOrders.length; i++) {
          if (freshOrders[i].status != _orders[i].status) {
            hasChanges = true;
            break;
          }
        }
      }

      if (hasChanges) {
        _orders = freshOrders;
        notifyListeners();
      }
    } catch (_) {
      // Silently ignore errors during polling
    }
  }

  /// Fetch single order detail
  Future<void> fetchOrderDetail(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _selectedOrder = await _service.getById(id);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = ErrorHelper.extractMessage(e);
      notifyListeners();
    }
  }

  /// Silently refresh a single order detail (for live updates)
  Future<void> silentRefreshOrderDetail(String id) async {
    try {
      final freshOrder = await _service.getById(id);
      if (_selectedOrder != null && freshOrder.status != _selectedOrder!.status) {
        _selectedOrder = freshOrder;
        notifyListeners();
      }
    } catch (_) {
      // Silently ignore
    }
  }

  /// Start polling for live status updates (every 10 seconds)
  void startPolling({String? orderId}) {
    stopPolling();
    _isPolling = true;
    notifyListeners();

    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (orderId != null) {
        silentRefreshOrderDetail(orderId);
      } else {
        silentRefreshOrders();
      }
    });
  }

  /// Stop polling
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    if (_isPolling) {
      _isPolling = false;
      notifyListeners();
    }
  }

  /// Create a new order
  Future<Order> createOrder({
    required String therapistId,
    required String scheduleId,
    String? serviceId,
    String? serviceType,
    required String address,
    double? lat,
    double? lng,
    String? notes,
    String? documentUrl,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final order = await _service.create(
        therapistId: therapistId,
        scheduleId: scheduleId,
        serviceId: serviceId,
        serviceType: serviceType,
        address: address,
        lat: lat,
        lng: lng,
        notes: notes,
        documentUrl: documentUrl,
      );

      // Add to local list
      _orders.insert(0, order);

      _isLoading = false;
      notifyListeners();
      return order;
    } catch (e) {
      _isLoading = false;
      _error = ErrorHelper.extractMessage(e);
      notifyListeners();
      rethrow;
    }
  }

  /// Cancel an order
  Future<void> cancelOrder(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _service.delete(id);

      // Update local list
      _orders.removeWhere((o) => o.id == id);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = ErrorHelper.extractMessage(e);
      notifyListeners();
    }
  }

  void clearSelection() {
    _selectedOrder = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
