import 'package:flutter/material.dart';
import '../../services/record_service.dart';
import '../../models/therapy_record.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../utils/routes.dart';
import '../../widgets/loading_indicator.dart';

class RecordListScreen extends StatefulWidget {
  const RecordListScreen({super.key});
  @override
  State<RecordListScreen> createState() => _RecordListScreenState();
}

class _RecordListScreenState extends State<RecordListScreen> {
  final RecordService _service = RecordService();
  List<TherapyRecord> _records = [];
  bool _isLoading = true;
  bool _hasLoaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasLoaded) {
      _hasLoaded = true;
      // Check if a patientId was passed (from admin/therapist view)
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is String && args.isNotEmpty) {
        _loadByPatientId(args);
      } else {
        // Patient viewing their own records (mobile self-service)
        _loadMyRecords();
      }
    }
  }

  Future<void> _loadByPatientId(String patientId) async {
    try {
      final records = await _service.getByPatientId(patientId);
      if (mounted) setState(() { _records = records; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMyRecords() async {
    try {
      final records = await _service.getMyRecords();
      if (mounted) setState(() { _records = records; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rekam Terapi')),
      body: _isLoading
          ? const LoadingIndicator()
          : _records.isEmpty
              ? const Center(child: Text('Belum ada rekam terapi', style: TextStyle(color: AppColors.textMuted, fontSize: 16)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _records.length,
                  itemBuilder: (ctx, i) {
                    final r = _records[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: AppColors.primaryLight.withValues(alpha: 0.2), child: Text('${r.sessionNumber}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary))),
                        title: Text('Sesi ${r.sessionNumber}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(Helpers.formatDateTime(r.checkInAt ?? r.createdAt)),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.pushNamed(context, AppRoutes.recordDetail, arguments: r.id),
                      ),
                    );
                  },
                ),
    );
  }
}
