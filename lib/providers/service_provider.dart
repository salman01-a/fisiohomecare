import 'package:flutter/material.dart';
import '../models/service.dart';
import '../services/service_service.dart';

class ServiceProvider extends ChangeNotifier {
  final ServiceService _service = ServiceService();

  List<Service> _services = [];
  bool _isLoading = false;
  String? _error;

  List<Service> get services => _services;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch all available services
  Future<void> fetchServices() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _services = await _service.getAll();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
}
