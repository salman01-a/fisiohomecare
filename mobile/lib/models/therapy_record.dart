class TherapyRecord {
  final String id;
  final String orderId;
  final String therapistId;
  final String patientId;
  final String? chiefComplaint;
  final String? diagnosis;
  final String? actionsTaken;
  final int sessionNumber;
  final DateTime? checkInAt;
  final DateTime? checkOutAt;
  final DateTime? createdAt;

  TherapyRecord({
    required this.id,
    required this.orderId,
    required this.therapistId,
    required this.patientId,
    this.chiefComplaint,
    this.diagnosis,
    this.actionsTaken,
    this.sessionNumber = 1,
    this.checkInAt,
    this.checkOutAt,
    this.createdAt,
  });

  factory TherapyRecord.fromJson(Map<String, dynamic> json) {
    return TherapyRecord(
      id: json['id'] ?? '',
      orderId: json['order_id'] ?? '',
      therapistId: json['therapist_id'] ?? '',
      patientId: json['patient_id'] ?? '',
      chiefComplaint: json['chief_complaint'],
      diagnosis: json['diagnosis'],
      actionsTaken: json['actions_taken'],
      sessionNumber: json['session_number'] ?? 1,
      checkInAt:
          json['check_in_at'] != null
              ? DateTime.parse(json['check_in_at'])
              : null,
      checkOutAt:
          json['check_out_at'] != null
              ? DateTime.parse(json['check_out_at'])
              : null,
      createdAt:
          json['created_at'] != null
              ? DateTime.parse(json['created_at'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'therapist_id': therapistId,
      'patient_id': patientId,
      'chief_complaint': chiefComplaint,
      'diagnosis': diagnosis,
      'actions_taken': actionsTaken,
      'session_number': sessionNumber,
    };
  }
}
