import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  final Dio _dio = ApiClient().dio;

  /// Login with email & password → returns { token, user }
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post(
      ApiConfig.login,
      data: {'email': email, 'password': password},
    );
    return response.data;
  }

  /// Register patient account
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? address,
    String? medicalHistory,
    String? emergencyContact,
    String? dob,
  }) async {
    final response = await _dio.post(
      ApiConfig.register,
      data: {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
        'role': 'patient',
        'address': address,
        'medical_history': medicalHistory,
        'emergency_contact': emergencyContact,
        'dob': dob,
      },
    );
    return response.data;
  }

  /// Get current user profile
  Future<User> getMe() async {
    final response = await _dio.get(ApiConfig.me);
    return User.fromJson(response.data['data']);
  }
}
