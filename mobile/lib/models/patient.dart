import 'user.dart';

class Patient {
  final String id;
  final String userId;
  final String? address;
  final String? medicalHistory;
  final String? emergencyContact;
  final String? dob;
  final User? user;

  Patient({
    required this.id,
    required this.userId,
    this.address,
    this.medicalHistory,
    this.emergencyContact,
    this.dob,
    this.user,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      address: json['address'],
      medicalHistory: json['medical_history'],
      emergencyContact: json['emergency_contact'],
      dob: json['dob'],
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'address': address,
      'medical_history': medicalHistory,
      'emergency_contact': emergencyContact,
      'dob': dob,
    };
  }
}
