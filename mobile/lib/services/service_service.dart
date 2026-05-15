import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/service.dart';
import 'api_client.dart';

class ServiceService {
  final Dio _dio = ApiClient().dio;

  /// Get all available services
  Future<List<Service>> getAll() async {
    final response = await _dio.get(ApiConfig.services);
    final List data = response.data['data'] ?? [];
    return data.map((json) => Service.fromJson(json)).toList();
  }

  /// Get service by ID
  Future<Service> getById(String id) async {
    final response = await _dio.get(ApiConfig.serviceById(id));
    return Service.fromJson(response.data['data']);
  }
}
