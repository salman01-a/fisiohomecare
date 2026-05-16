import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/order.dart';
import 'api_client.dart';

class OrderService {
  final Dio _dio = ApiClient().dio;

  /// Get all orders (auto-filtered by role on backend)
  Future<List<Order>> getAll({
    String? status,
    int? page,
    int? limit,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null) queryParams['status'] = status;
    if (page != null) queryParams['page'] = page;
    if (limit != null) queryParams['limit'] = limit;

    final response = await _dio.get(
      ApiConfig.orders,
      queryParameters: queryParams,
    );

    final List data = response.data['data'] ?? [];
    return data.map((json) => Order.fromJson(json)).toList();
  }

  /// Get order by ID
  Future<Order> getById(String id) async {
    final response = await _dio.get(ApiConfig.orderById(id));
    return Order.fromJson(response.data['data']);
  }

  /// Create a new order (patient only)
  Future<Order> create({
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
    final response = await _dio.post(
      ApiConfig.orders,
      data: {
        'therapist_id': therapistId,
        'schedule_id': scheduleId,
        'service_id': serviceId,
        'service_type': serviceType,
        'address': address,
        'lat': lat,
        'lng': lng,
        'notes': notes,
        'document_url': documentUrl,
      },
    );
    return Order.fromJson(response.data['data']);
  }

  /// Cancel an order
  Future<void> delete(String id) async {
    await _dio.delete(ApiConfig.orderById(id));
  }

  /// Rate a completed order (patient only)
  Future<void> rateOrder(String orderId, int rating, {String? comment}) async {
    await _dio.post(
      ApiConfig.orderRate(orderId),
      data: {
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
      },
    );
  }
}
