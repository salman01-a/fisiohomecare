class Payment {
  final String id;
  final String orderId;
  final double amount;
  final String method;
  final String status;
  final String? proofUrl;
  final String? confirmedBy;
  final DateTime? paidAt;
  final DateTime? createdAt;

  Payment({
    required this.id,
    required this.orderId,
    required this.amount,
    required this.method,
    required this.status,
    this.proofUrl,
    this.confirmedBy,
    this.paidAt,
    this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] ?? '',
      orderId: json['order_id'] ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      method: json['method'] ?? 'transfer',
      status: json['status'] ?? 'pending',
      proofUrl: json['proof_url'],
      confirmedBy: json['confirmed_by'],
      paidAt:
          json['paid_at'] != null ? DateTime.parse(json['paid_at']) : null,
      createdAt:
          json['created_at'] != null
              ? DateTime.parse(json['created_at'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'amount': amount,
      'method': method,
    };
  }
}
