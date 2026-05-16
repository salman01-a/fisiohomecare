/// Model TherapyRecord — data SQL (rekam terapi utama)
/// + data NoSQL (catatan fleksibel, progres pemulihan, foto/dokumen pendukung)
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

  // --- NoSQL fields (dari Firestore via backend) ---
  final NosqlDetails? nosqlDetails;

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
    this.nosqlDetails,
  });

  factory TherapyRecord.fromJson(Map<String, dynamic> json) {
    return TherapyRecord(
      id: json['id']?.toString() ?? '',
      orderId: json['order_id']?.toString() ?? '',
      therapistId: json['therapist_id']?.toString() ?? '',
      patientId: json['patient_id']?.toString() ?? '',
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
      nosqlDetails: json['nosql_details'] != null
          ? NosqlDetails.fromJson(json['nosql_details'])
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

/// Data NoSQL dari Firestore — catatan terapi fleksibel
class NosqlDetails {
  final String? flexibleNotes;
  final num? progressRating;
  final List<String> attachments;

  NosqlDetails({
    this.flexibleNotes,
    this.progressRating,
    this.attachments = const [],
  });

  factory NosqlDetails.fromJson(Map<String, dynamic> json) {
    List<String> parseAttachments(dynamic data) {
      if (data == null) return [];
      if (data is List) return data.map((e) => e.toString()).toList();
      return [];
    }

    return NosqlDetails(
      flexibleNotes: json['flexible_notes'],
      progressRating: json['progress_rating'],
      attachments: parseAttachments(json['attachments']),
    );
  }
}
