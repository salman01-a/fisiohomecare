import 'user.dart';

class Therapist {
  final String id;
  final String userId;
  final String licenseNumber;
  final String? licenseDocUrl;
  final String? photoUrl;
  final String? specialization;
  final String status;
  final String? validatedBy;
  final DateTime? validatedAt;
  final double rating;
  final User? user;

  Therapist({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    this.licenseDocUrl,
    this.photoUrl,
    this.specialization,
    required this.status,
    this.validatedBy,
    this.validatedAt,
    this.rating = 0.0,
    this.user,
  });

  factory Therapist.fromJson(Map<String, dynamic> json) {
    return Therapist(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      licenseNumber: json['license_number'] ?? '',
      licenseDocUrl: json['license_doc_url'],
      photoUrl: json['photo_url'],
      specialization: json['specialization'],
      status: json['status'] ?? 'pending',
      validatedBy: json['validated_by'],
      validatedAt:
          json['validated_at'] != null
              ? DateTime.parse(json['validated_at'])
              : null,
      rating: double.tryParse(json['rating']?.toString() ?? '0') ?? 0.0,
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'license_number': licenseNumber,
      'license_doc_url': licenseDocUrl,
      'photo_url': photoUrl,
      'specialization': specialization,
      'status': status,
      'rating': rating,
    };
  }

  /// Display name (from nested user or fallback)
  String get displayName => user?.name ?? 'Terapis';
}
