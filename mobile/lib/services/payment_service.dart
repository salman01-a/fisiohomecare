import 'dart:io';
import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/payment.dart';
import 'api_client.dart';
import 'upload_service.dart';

class PaymentService {
  final Dio _dio = ApiClient().dio;
  final UploadService _uploadService = UploadService();

  /// Initiate payment. If proofFile is provided, uploads it first then sends the URL.
  Future<Payment> initiate({
    required int orderId,
    required double amount,
    required String method,   // 'transfer' or 'cash'
    File? proofFile,          // optional: upload bukti transfer
  }) async {
    String? proofUrl;

    // Upload proof file first if provided
    if (proofFile != null) {
      proofUrl = await _uploadService.uploadPaymentProof(proofFile);
    }

    final response = await _dio.post(
      ApiConfig.paymentInitiate,
      data: {
        'order_id': orderId,
        'amount': amount,
        'method': method,
        if (proofUrl != null) 'proof_url': proofUrl,
      },
    );
    return Payment.fromJson(response.data['data']);
  }

  /// Get payment status by order ID
  Future<Payment> getByOrderId(int orderId) async {
    final response = await _dio.get(ApiConfig.paymentByOrderId(orderId.toString()));
    return Payment.fromJson(response.data['data']);
  }
}
