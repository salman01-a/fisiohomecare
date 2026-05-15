import 'therapist.dart';
import 'service.dart';
import 'schedule.dart';
import 'patient.dart';
import 'payment.dart';
import 'therapy_record.dart';

class Order {
  final String id;
  final String patientId;
  final String therapistId;
  final String scheduleId;
  final String? serviceId;
  final String? serviceType;
  final String address;
  final double? lat;
  final double? lng;
  final String status;
  final String? documentUrl;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Nested relations (from API includes)
  final Therapist? therapist;
  final Service? service;
  final Schedule? schedule;
  final Patient? patient;
  final Payment? payment;
  final TherapyRecord? therapyRecord;

  Order({
    required this.id,
    required this.patientId,
    required this.therapistId,
    required this.scheduleId,
    this.serviceId,
    this.serviceType,
    required this.address,
    this.lat,
    this.lng,
    required this.status,
    this.documentUrl,
    this.notes,
    this.createdAt,
    this.updatedAt,
    this.therapist,
    this.service,
    this.schedule,
    this.patient,
    this.payment,
    this.therapyRecord,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      patientId: json['patient_id']?.toString() ?? '',
      therapistId: json['therapist_id']?.toString() ?? '',
      scheduleId: json['schedule_id']?.toString() ?? '',
      serviceId: json['service_id']?.toString(),
      serviceType: json['service_type'],
      address: json['address'] ?? '',
      lat: double.tryParse(json['lat']?.toString() ?? ''),
      lng: double.tryParse(json['lng']?.toString() ?? ''),
      status: json['status'] ?? 'pending',
      documentUrl: json['document_url'],
      notes: json['notes'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      therapist: json['therapist'] != null
          ? Therapist.fromJson(json['therapist'])
          : null,
      service: json['service'] != null
          ? Service.fromJson(json['service'])
          : null,
      schedule: json['schedule'] != null
          ? Schedule.fromJson(json['schedule'])
          : null,
      patient: json['patient'] != null
          ? Patient.fromJson(json['patient'])
          : null,
      payment: json['payment'] != null
          ? Payment.fromJson(json['payment'])
          : null,
      therapyRecord: json['therapy_record'] != null
          ? TherapyRecord.fromJson(json['therapy_record'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'therapist_id': therapistId,
      'schedule_id': scheduleId,
      'service_id': serviceId,
      'service_type': serviceType,
      'address': address,
      'lat': lat,
      'lng': lng,
      'notes': notes,
    };
  }
}
