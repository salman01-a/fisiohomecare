import 'package:flutter/material.dart';
import '../../services/record_service.dart';
import '../../models/therapy_record.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/loading_indicator.dart';
import '../../config/api_config.dart';

class RecordDetailScreen extends StatefulWidget {
  const RecordDetailScreen({super.key});
  @override
  State<RecordDetailScreen> createState() => _RecordDetailScreenState();
}

class _RecordDetailScreenState extends State<RecordDetailScreen> {
  final RecordService _service = RecordService();
  TherapyRecord? _record;
  bool _isLoading = true;

  // Image URLs with token (resolved async)
  List<String> _resolvedPhotoUrls = [];
  List<String> _resolvedAttachmentUrls = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ModalRoute.of(context)!.settings.arguments as String;
      _load(id);
    });
  }

  Future<void> _load(String id) async {
    try {
      final r = await _service.getById(id);
      if (mounted) {
        setState(() { _record = r; _isLoading = false; });
        // Resolve image URLs with token
        _resolveImageUrls(r);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resolveImageUrls(TherapyRecord r) async {
    // Resolve photo URLs
    final resolvedPhotos = <String>[];
    for (final url in r.photoUrls) {
      final resolved = await ApiConfig.getImageUrlWithToken(url);
      if (resolved.isNotEmpty) resolvedPhotos.add(resolved);
    }

    // Resolve NoSQL attachment URLs
    final resolvedAttachments = <String>[];
    if (r.nosqlDetails != null) {
      for (final url in r.nosqlDetails!.attachments) {
        final resolved = await ApiConfig.getImageUrlWithToken(url);
        if (resolved.isNotEmpty) resolvedAttachments.add(resolved);
      }
    }

    if (mounted) {
      setState(() {
        _resolvedPhotoUrls = resolvedPhotos;
        _resolvedAttachmentUrls = resolvedAttachments;
      });
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
                      // Session header with date
                      Center(
                        child: Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(color: AppColors.primaryLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(18)),
                          child: const Center(child: Icon(Icons.medical_information_outlined, color: AppColors.primary, size: 32)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Center(
                        child: Text(
                          _record!.sessionLabel,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // === SQL Data: Rekam Terapi Utama ===
                      _sectionTitle('📋 Rekam Terapi Utama', 'Data pemeriksaan dan tindakan'),
                      if (_record!.checkInAt != null) _tile('Check-in', Helpers.formatDateTime(_record!.checkInAt)),
                      if (_record!.checkOutAt != null) _tile('Check-out', Helpers.formatDateTime(_record!.checkOutAt)),
                      if (_record!.chiefComplaint != null) _tile('Keluhan Utama', _record!.chiefComplaint!),
                      if (_record!.diagnosis != null) _tile('Diagnosis', _record!.diagnosis!),
                      if (_record!.actionsTaken != null) _tile('Tindakan', _record!.actionsTaken!),

                      // Foto dokumentasi dari terapis (SQL)
                      if (_resolvedPhotoUrls.isNotEmpty)
                        _attachmentsSection(_resolvedPhotoUrls, title: 'Foto Dokumentasi Terapis'),

                      // === NoSQL Data: Catatan Fleksibel, Progres, Foto ===
                      if (_record!.nosqlDetails != null) ...[
                        const SizedBox(height: 24),
                        _sectionTitle('📝 Data Tambahan', 'Catatan perkembangan dan dokumen pendukung'),

                        // Progres Pemulihan
                        if (_record!.nosqlDetails!.progressRating != null)
                          _progressCard(_record!.nosqlDetails!.progressRating!),

                        // Catatan Fleksibel
                        if (_record!.nosqlDetails!.flexibleNotes != null &&
                            _record!.nosqlDetails!.flexibleNotes!.isNotEmpty)
                          _tile('Catatan Tambahan', _record!.nosqlDetails!.flexibleNotes!),

                        // Foto/Dokumen Pendukung
                        if (_resolvedAttachmentUrls.isNotEmpty)
                          _attachmentsSection(_resolvedAttachmentUrls),
                      ],

                      // Info ketika NoSQL belum ada
                      if (_record!.nosqlDetails == null) ...[
                        const SizedBox(height: 24),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.info_outline, color: AppColors.textMuted, size: 20),
                              SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'Belum ada catatan tambahan, progres pemulihan, atau foto pendukung.',
                                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _sectionTitle(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        ],
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

  /// Card progres pemulihan dengan rating bar visual
  Widget _progressCard(num rating) {
    final double ratingValue = rating.toDouble().clamp(0.0, 10.0);
    final percentage = (ratingValue / 10 * 100).round();

    Color progressColor;
    String progressLabel;
    if (ratingValue <= 3) {
      progressColor = AppColors.error;
      progressLabel = 'Awal Pemulihan';
    } else if (ratingValue <= 6) {
      progressColor = AppColors.warning;
      progressLabel = 'Dalam Progres';
    } else {
      progressColor = AppColors.success;
      progressLabel = 'Pemulihan Baik';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Progres Pemulihan', style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: progressColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(progressLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: progressColor)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: ratingValue / 10,
                      minHeight: 10,
                      backgroundColor: AppColors.surfaceVariant,
                      valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text('$percentage%', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: progressColor)),
              ],
            ),
            const SizedBox(height: 4),
            Text('Rating: ${ratingValue.toStringAsFixed(1)} / 10', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  /// Grid foto/dokumen pendukung (sudah pakai URL dengan token)
  Widget _attachmentsSection(List<String> resolvedUrls, {String title = 'Foto/Dokumen Pendukung'}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$title (${resolvedUrls.length})', style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: resolvedUrls.length,
              itemBuilder: (ctx, i) {
                return GestureDetector(
                  onTap: () => _showFullImage(context, resolvedUrls[i]),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      resolvedUrls[i],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.broken_image_outlined, color: AppColors.textMuted),
                            SizedBox(height: 4),
                            Text('Error', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                      loadingBuilder: (ctx, child, progress) {
                        if (progress == null) return child;
                        return Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showFullImage(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: GestureDetector(
          onTap: () => Navigator.pop(ctx),
          child: InteractiveViewer(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(url, fit: BoxFit.contain),
            ),
          ),
        ),
      ),
    );
  }
}
