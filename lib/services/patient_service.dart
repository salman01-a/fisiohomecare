import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/patient.dart';
import '../models/order.dart';
import '../models/therapy_record.dart';
import 'api_client.dart';

class PatientService {
  final Dio _dio = ApiClient().dio;

  /// Get my patient profile
  Future<Patient> getMyProfile() async {
    final response = await _dio.get(ApiConfig.patientMe);
    return Patient.fromJson(response.data['data']);
  }

  /// Update my patient profile
  Future<Patient> updateMyProfile({
    String? name,
    String? phone,
    String? address,
    String? medicalHistory,
    String? emergencyContact,
    String? dob,
  }) async {
    final response = await _dio.put(
      ApiConfig.patientMe,
      data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (address != null) 'address': address,
        if (medicalHistory != null) 'medical_history': medicalHistory,
        if (emergencyContact != null) 'emergency_contact': emergencyContact,
        if (dob != null) 'dob': dob,
      },
    );
    return Patient.fromJson(response.data['data']);
  }

  /// Get my orders
  Future<List<Order>> getMyOrders({String? status, int? page, int? limit}) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status;
    if (page != null) queryParams['page'] = page;
    if (limit != null) queryParams['limit'] = limit;

    final response = await _dio.get(
      ApiConfig.patientMyOrders,
      queryParameters: queryParams,
    );
    final List data = response.data['data'] ?? [];
    return data.map((json) => Order.fromJson(json)).toList();
  }

  /// Get my therapy records
  Future<List<TherapyRecord>> getMyRecords({int? page, int? limit}) async {
    final queryParams = <String, dynamic>{};
    if (page != null) queryParams['page'] = page;
    if (limit != null) queryParams['limit'] = limit;

    final response = await _dio.get(
      ApiConfig.patientMyRecords,
      queryParameters: queryParams,
    );
    final List data = response.data['data'] ?? [];
    return data.map((json) => TherapyRecord.fromJson(json)).toList();
  }
}
