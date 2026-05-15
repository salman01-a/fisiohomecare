import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/therapist.dart';
import '../models/schedule.dart';
import 'api_client.dart';

class TherapistService {
  final Dio _dio = ApiClient().dio;

  /// Get all therapists with optional filters
  Future<List<Therapist>> getAll({
    String? status,
    String? specialization,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status;
    if (specialization != null) queryParams['specialization'] = specialization;

    final response = await _dio.get(
      ApiConfig.therapists,
      queryParameters: queryParams,
    );

    final List data = response.data['data'] ?? [];
    return data.map((json) => Therapist.fromJson(json)).toList();
  }

  /// Get therapist by ID
  Future<Therapist> getById(String id) async {
    final response = await _dio.get(ApiConfig.therapistById(id));
    return Therapist.fromJson(response.data['data']);
  }

  /// Get therapist's available schedules
  Future<List<Schedule>> getSchedules(
    String therapistId, {
    String? date,
    bool? isBooked,
  }) async {
    final queryParams = <String, dynamic>{};
    if (date != null) queryParams['date'] = date;
    if (isBooked != null) queryParams['is_booked'] = isBooked;

    final response = await _dio.get(
      ApiConfig.therapistSchedules(therapistId),
      queryParameters: queryParams,
    );

    final List data = response.data['data'] ?? [];
    return data.map((json) => Schedule.fromJson(json)).toList();
  }
}
