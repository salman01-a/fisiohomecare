import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/payment.dart';
import 'api_client.dart';

class PaymentService {
  final Dio _dio = ApiClient().dio;

  /// Initiate payment for an order
  Future<Payment> initiate({
    required String orderId,
    required double amount,
    required String method,
    String? proofUrl,
  }) async {
    final response = await _dio.post(
      ApiConfig.paymentInitiate,
      data: {
        'order_id': orderId,
        'amount': amount,
        'method': method,
        'proof_url': proofUrl,
      },
    );
    return Payment.fromJson(response.data['data']);
  }

  /// Get payment status by order ID
  Future<Payment> getByOrderId(String orderId) async {
    final response = await _dio.get(ApiConfig.paymentByOrderId(orderId));
    return Payment.fromJson(response.data['data']);
  }
}
