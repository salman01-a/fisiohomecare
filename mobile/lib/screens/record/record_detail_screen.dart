import 'package:flutter/material.dart';
import '../../services/record_service.dart';
import '../../models/therapy_record.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/loading_indicator.dart';

class RecordDetailScreen extends StatefulWidget {
  const RecordDetailScreen({super.key});
  @override
  State<RecordDetailScreen> createState() => _RecordDetailScreenState();
}

class _RecordDetailScreenState extends State<RecordDetailScreen> {
  final RecordService _service = RecordService();
  TherapyRecord? _record;
  bool _isLoading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = ModalRoute.of(context)!.settings.arguments as String;
    _load(id);
  }

  Future<void> _load(String id) async {
    try {
      final r = await _service.getById(id);
      if (mounted) setState(() { _record = r; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Rekam Terapi')),
      body: _isLoading
          ? const LoadingIndicator()
          : _record == null
              ? const Center(child: Text('Tidak ditemukan'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(color: AppColors.primaryLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(18)),
                          child: Center(child: Text('${_record!.sessionNumber}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primary))),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Center(child: Text('Sesi ${_record!.sessionNumber}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
                      const SizedBox(height: 24),

                      if (_record!.checkInAt != null) _tile('Check-in', Helpers.formatDateTime(_record!.checkInAt)),
                      if (_record!.checkOutAt != null) _tile('Check-out', Helpers.formatDateTime(_record!.checkOutAt)),
                      if (_record!.chiefComplaint != null) _tile('Keluhan Utama', _record!.chiefComplaint!),
                      if (_record!.diagnosis != null) _tile('Diagnosis', _record!.diagnosis!),
                      if (_record!.actionsTaken != null) _tile('Tindakan', _record!.actionsTaken!),
                    ],
                  ),
                ),
    );
  }

  Widget _tile(String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 15, height: 1.5)),
          ],
        ),
      ),
    );
  }
}
