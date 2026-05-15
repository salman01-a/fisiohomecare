class Schedule {
  final String id;
  final String therapistId;
  final String date;
  final String startTime;
  final String endTime;
  final bool isBooked;

  Schedule({
    required this.id,
    required this.therapistId,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.isBooked = false,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'] ?? '',
      therapistId: json['therapist_id'] ?? '',
      date: json['date'] ?? '',
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'] ?? '',
      isBooked: json['is_booked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'therapist_id': therapistId,
      'date': date,
      'start_time': startTime,
      'end_time': endTime,
      'is_booked': isBooked,
    };
  }
}
