import 'dart:convert';

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

  // Jadwal dari order.schedule (untuk label sesi)
  final String? scheduleDate;      // e.g. "2024-05-24"
  final String? scheduleStartTime; // e.g. "19:00:00"
  final String? serviceName;       // e.g. "Fisioterapi Umum"

  // --- NoSQL fields (dari Firestore via backend) ---
  final NosqlDetails? nosqlDetails;

  // --- SQL photo URLs (foto dari terapis) ---
  final List<String> photoUrls;

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
    this.scheduleDate,
    this.scheduleStartTime,
    this.serviceName,
    this.nosqlDetails,
    this.photoUrls = const [],
  });

  factory TherapyRecord.fromJson(Map<String, dynamic> json) {
    // Parse nested order.schedule jika ada
    String? schedDate;
    String? schedTime;
    String? svcName;
    if (json['order'] != null) {
      final order = json['order'];
      if (order['schedule'] != null) {
        schedDate = order['schedule']['date'];
        schedTime = order['schedule']['start_time'];
      }
      if (order['service'] != null) {
        svcName = order['service']['name'];
      }
    }

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
      scheduleDate: schedDate,
      scheduleStartTime: schedTime,
      serviceName: svcName,
      nosqlDetails: json['nosql_details'] != null
          ? NosqlDetails.fromJson(json['nosql_details'])
          : null,
      photoUrls: _parsePhotoUrls(json['photo_urls']),
    );
  }

  static List<String> _parsePhotoUrls(dynamic data) {
    if (data == null) return [];
    if (data is List) return data.map((e) => e.toString()).toList();
    if (data is String) {
      try {
        final decoded = List<dynamic>.from(
          json.decode(data) as List,
        );
        return decoded.map((e) => e.toString()).toList();
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  /// Label sesi yang bagus — pakai tanggal jadwal jika tersedia
  String get sessionLabel {
    if (scheduleDate != null && scheduleDate!.isNotEmpty) {
      try {
        final dt = DateTime.parse(scheduleDate!);
        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        final dateStr = '${dt.day} ${months[dt.month - 1]} ${dt.year}';
        if (scheduleStartTime != null && scheduleStartTime!.isNotEmpty) {
          // Format "19:00:00" → "19:00"
          final timeParts = scheduleStartTime!.split(':');
          final timeStr = '${timeParts[0]}:${timeParts[1]}';
          return '$dateStr, $timeStr';
        }
        return dateStr;
      } catch (_) {}
    }
    if (checkInAt != null) {
      final dt = checkInAt!;
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (createdAt != null) {
      final dt = createdAt!;
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return 'Sesi $sessionNumber';
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
