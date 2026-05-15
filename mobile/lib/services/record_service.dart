import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/therapy_record.dart';
import 'api_client.dart';

class RecordService {
  final Dio _dio = ApiClient().dio;

  /// Get therapy record by ID
  Future<TherapyRecord> getById(String id) async {
    final response = await _dio.get(ApiConfig.recordById(id));
    return TherapyRecord.fromJson(response.data['data']);
  }

  /// Get all therapy records for a patient
  Future<List<TherapyRecord>> getByPatientId(String patientId) async {
    final response = await _dio.get(ApiConfig.patientRecords(patientId));
    final List data = response.data['data'] ?? [];
    return data.map((json) => TherapyRecord.fromJson(json)).toList();
  }
}
