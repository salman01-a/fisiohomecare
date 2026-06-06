class Service {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int durationMinutes;
  final bool isActive;

  Service({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.durationMinutes = 60,
    this.isActive = true,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      durationMinutes: json['duration_minutes'] ?? 60,
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'duration_minutes': durationMinutes,
      'is_active': isActive,
    };
  }
}
