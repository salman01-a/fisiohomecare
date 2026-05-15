import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/order_service.dart';

class OrderProvider extends ChangeNotifier {
  final OrderService _service = OrderService();

  List<Order> _orders = [];
  Order? _selectedOrder;
  bool _isLoading = false;
  String? _error;

  List<Order> get orders => _orders;
  Order? get selectedOrder => _selectedOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;

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
      _error = e.toString();
      notifyListeners();
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
      _error = e.toString();
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
      _error = e.toString();
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
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearSelection() {
    _selectedOrder = null;
    notifyListeners();
  }
}
