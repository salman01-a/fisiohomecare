import 'package:flutter/material.dart';
import '../models/therapist.dart';
import '../models/schedule.dart';
import '../services/therapist_service.dart';

class TherapistProvider extends ChangeNotifier {
  final TherapistService _service = TherapistService();

  List<Therapist> _therapists = [];
  Therapist? _selectedTherapist;
  List<Schedule> _schedules = [];
  bool _isLoading = false;
  String? _error;

  List<Therapist> get therapists => _therapists;
  Therapist? get selectedTherapist => _selectedTherapist;
  List<Schedule> get schedules => _schedules;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Only show active (validated) therapists to patients
  Future<void> fetchTherapists({String? specialization}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _therapists = await _service.getAll(
        status: 'active',
        specialization: specialization,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Fetch therapist detail
  Future<void> fetchTherapistDetail(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _selectedTherapist = await _service.getById(id);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Fetch available schedules for a therapist
  Future<void> fetchSchedules(String therapistId, {String? date}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _schedules = await _service.getSchedules(
        therapistId,
        date: date,
        isBooked: false,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearSelection() {
    _selectedTherapist = null;
    _schedules = [];
    notifyListeners();
  }
}
