import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/user.dart';
import '../utils/error_helper.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  /// Try to restore session on app start
  Future<bool> tryAutoLogin() async {
    try {
      final hasToken = await ApiClient.hasToken();
      if (!hasToken) return false;

      _isLoading = true;
      notifyListeners();

      _user = await _authService.getMe();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      await ApiClient.removeToken();
      _user = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Login with email & password
  Future<void> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final result = await _authService.login(email, password);
      final token = result['data']['token'];
      final userData = result['data']['user'];

      await ApiClient.saveToken(token);
      _user = User.fromJson(userData);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = _extractErrorMessage(e);
      notifyListeners();
      rethrow;
    }
  }

  /// Register new patient via backend
  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? address,
    String? medicalHistory,
    String? emergencyContact,
    String? dob,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Register directly on backend (no Firebase Auth client-side)
      final result = await _authService.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
        address: address,
        medicalHistory: medicalHistory,
        emergencyContact: emergencyContact,
        dob: dob,
      );

      final token = result['data']['token'];
      final userData = result['data']['user'];

      await ApiClient.saveToken(token);
      _user = User.fromJson(userData);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = _extractErrorMessage(e);
      notifyListeners();
      rethrow;
    }
  }

  /// Logout
  Future<void> logout() async {
    await ApiClient.removeToken();
    _user = null;
    _error = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _extractErrorMessage(dynamic e) {
    return ErrorHelper.extractMessage(e);
  }
}
