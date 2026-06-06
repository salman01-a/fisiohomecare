import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';
import '../../services/nosql_service.dart';
import '../../services/order_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../utils/routes.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/custom_button.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});
  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> with WidgetsBindingObserver {
  final NosqlService _nosqlService = NosqlService();
  final OrderService _orderService = OrderService();
  Map<String, dynamic>? _tracking;
  bool _trackingLoading = false;
  int _selectedRating = 0;
  final TextEditingController _commentController = TextEditingController();
  bool _submittingRating = false;
  late String _orderId;
  late OrderProvider _orderProvider;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _orderId = ModalRoute.of(context)!.settings.arguments as String;
      _orderProvider = Provider.of<OrderProvider>(context, listen: false);
      _orderProvider.fetchOrderDetail(_orderId);
      _orderProvider.startPolling(orderId: _orderId); // Start live updates for this order
      _loadTracking(_orderId);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _orderProvider.stopPolling();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final op = Provider.of<OrderProvider>(context, listen: false);
    if (state == AppLifecycleState.paused) {
      op.stopPolling();
    } else if (state == AppLifecycleState.resumed) {
      op.startPolling(orderId: _orderId);
    }
  }

  Future<void> _loadTracking(String orderId) async {
    setState(() => _trackingLoading = true);
    try {
      final data = await _nosqlService.getVisitTracking(orderId);
      if (mounted) setState(() { _tracking = data; _trackingLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _trackingLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: Consumer<OrderProvider>(
        builder: (ctx, op, _) {
          if (op.isLoading && op.selectedOrder == null) return const LoadingIndicator();
          final o = op.selectedOrder;
          if (o == null) return const Center(child: Text('Pesanan tidak ditemukan'));

          // Reload tracking data silently if status changes (defer to avoid setState during build)
          if (op.isPolling && _tracking != null && _tracking!['current_status'] != o.status) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _loadTracking(o.id);
            });
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Live status indicator bar
                if (op.isPolling && (o.status == 'confirmed' || o.status == 'otw' || o.status == 'ongoing'))
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            shape: BoxShape.circle,
                            boxShadow: [BoxShadow(color: AppColors.success.withValues(alpha: 0.4), blurRadius: 4)],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Menerima pembaruan status langsung',
                          style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),

                // Status header
                Center(child: StatusBadge(status: o.status)),
                const SizedBox(height: 20),

                // Details card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Informasi Pesanan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 14),
                        _row('Layanan', o.service?.name ?? o.serviceType ?? '-'),
                        _row('Terapis', o.therapist?.displayName ?? '-'),
                        if (o.schedule != null) ...[
                          _row('Tanggal', Helpers.formatDate(o.schedule!.date)),
                          _row('Waktu', '${Helpers.formatTime(o.schedule!.startTime)} - ${Helpers.formatTime(o.schedule!.endTime)}'),
                        ],
                        _row('Alamat', o.address),
                        if (o.notes != null && o.notes!.isNotEmpty) _row('Catatan', o.notes!),
                        if (o.service != null) ...[
                          const Divider(height: 24),
                          _row('Total', Helpers.formatCurrency(o.service!.price), isBold: true),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // === Visit Tracking (NoSQL) ===
                _buildTrackingSection(),
                const SizedBox(height: 16),

                // Payment section
                if (o.status == 'confirmed' || o.status == 'pending')
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Pembayaran', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          if (o.payment != null) ...[
                            _row('Status', Helpers.paymentStatusLabel(o.payment!.status)),
                            _row('Metode', Helpers.capitalize(o.payment!.method)),
                            _row('Jumlah', Helpers.formatCurrency(o.payment!.amount)),
                          ] else ...[
                            const Text('Belum ada pembayaran', style: TextStyle(color: AppColors.textMuted)),
                            const SizedBox(height: 12),
                            CustomButton(
                              text: 'Bayar Sekarang',
                              onPressed: () => Navigator.pushNamed(context, AppRoutes.payment, arguments: o),
                              icon: Icons.payment_rounded,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),

                // === Therapy Record Section ===
                if (o.therapyRecord != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.medical_information_outlined, color: AppColors.success),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Rekam Medis — ${o.therapyRecord!.sessionLabel}',
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),
                          if (o.therapyRecord!.chiefComplaint != null && o.therapyRecord!.chiefComplaint!.isNotEmpty)
                            _row('Keluhan', o.therapyRecord!.chiefComplaint!),
                          if (o.therapyRecord!.diagnosis != null && o.therapyRecord!.diagnosis!.isNotEmpty)
                            _row('Diagnosis', o.therapyRecord!.diagnosis!),
                          if (o.therapyRecord!.actionsTaken != null && o.therapyRecord!.actionsTaken!.isNotEmpty)
                            _row('Tindakan', o.therapyRecord!.actionsTaken!),
                          if (o.therapyRecord!.checkInAt != null)
                            _row('Check-in', Helpers.formatDateTime(o.therapyRecord!.checkInAt)),
                          if (o.therapyRecord!.checkOutAt != null)
                            _row('Check-out', Helpers.formatDateTime(o.therapyRecord!.checkOutAt)),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => Navigator.pushNamed(
                                context,
                                AppRoutes.recordDetail,
                                arguments: o.therapyRecord!.id,
                              ),
                              icon: const Icon(Icons.visibility_outlined, size: 18),
                              label: const Text('Lihat Detail Lengkap'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 16),

                // === Rating Section ===
                if (o.status == 'done') _buildRatingSection(o, op),

                const SizedBox(height: 16),

                // Cancel button
                if (o.status == 'pending')
                  CustomButton(
                    text: 'Batalkan Pesanan',
                    isOutlined: true,
                    color: AppColors.error,
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Batalkan Pesanan?'),
                          content: const Text('Pesanan yang dibatalkan tidak dapat dikembalikan.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Tidak')),
                            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya, Batalkan', style: TextStyle(color: AppColors.error))),
                          ],
                        ),
                      );
                      if (confirm == true && mounted) {
                        await op.cancelOrder(o.id);
                        if (mounted) Navigator.pop(context);
                      }
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Section tracking kunjungan dari NoSQL (Firestore)
  Widget _buildTrackingSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 20, color: AppColors.primary),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Tracking Kunjungan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (_trackingLoading)
              const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(strokeWidth: 2)))
            else if (_tracking == null)
              const Text('Belum ada data tracking kunjungan.', style: TextStyle(color: AppColors.textMuted, fontSize: 13))
            else ...[
              // Current status
              if (_tracking!['current_status'] != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.my_location, color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Status: ${_trackingStatusLabel(_tracking!['current_status'])}',
                        style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary),
                      ),
                    ],
                  ),
                ),

              // History timeline
              if (_tracking!['history'] != null && _tracking!['history'] is List)
                ..._buildTimeline(_tracking!['history'] as List),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _buildTimeline(List history) {
    return List.generate(history.length, (i) {
      final item = history[i] as Map<String, dynamic>;
      final isLast = i == history.length - 1;
      return IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline dot + line
            SizedBox(
              width: 24,
              child: Column(
                children: [
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(
                      color: isLast ? AppColors.primary : AppColors.textMuted,
                      shape: BoxShape.circle,
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: AppColors.border,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _trackingStatusLabel(item['status']),
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: isLast ? AppColors.primary : AppColors.textPrimary,
                      ),
                    ),
                    if (item['notes'] != null && item['notes'].toString().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(item['notes'].toString(), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ),
                    if (item['timestamp'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          Helpers.formatDateTime(item['timestamp']),
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  String _trackingStatusLabel(dynamic status) {
    switch (status?.toString()) {
      case 'otw': return '🚗 Terapis Dalam Perjalanan';
      case 'arrived': return '📍 Terapis Tiba';
      case 'ongoing': return '▶️ Terapi Berlangsung';
      case 'done': return '✅ Terapi Selesai';
      default: return Helpers.capitalize(status?.toString() ?? '-');
    }
  }

  Widget _row(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
          Expanded(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: isBold ? FontWeight.w700 : FontWeight.w500, color: isBold ? AppColors.primary : AppColors.textPrimary))),
        ],
      ),
    );
  }

  /// Section rating terapis
  Widget _buildRatingSection(dynamic o, OrderProvider op) {
    // Sudah pernah rating
    if (o.rating != null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Rating Anda', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Row(
                children: List.generate(5, (i) => Icon(
                  i < o.rating ? Icons.star_rounded : Icons.star_border_rounded,
                  color: AppColors.warning,
                  size: 32,
                )),
              ),
              if (o.ratingComment != null && o.ratingComment!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(o.ratingComment!, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
              ],
            ],
          ),
        ),
      );
    }

    // Belum rating — form interaktif
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Beri Rating', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('Bagaimana pengalaman terapi Anda?', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(height: 14),
            // Star row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) => GestureDetector(
                onTap: () => setState(() => _selectedRating = i + 1),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    i < _selectedRating ? Icons.star_rounded : Icons.star_border_rounded,
                    color: AppColors.warning,
                    size: 40,
                  ),
                ),
              )),
            ),
            const SizedBox(height: 14),
            // Comment field
            TextField(
              controller: _commentController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Komentar (opsional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: _submittingRating ? 'Mengirim...' : 'Kirim Rating',
                icon: Icons.send_rounded,
                onPressed: _selectedRating == 0 || _submittingRating
                    ? null
                    : () => _submitRating(o.id, op),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitRating(String orderId, OrderProvider op) async {
    setState(() => _submittingRating = true);
    try {
      await _orderService.rateOrder(
        orderId,
        _selectedRating,
        comment: _commentController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rating berhasil dikirim! Terima kasih 🎉'), backgroundColor: AppColors.success),
        );
        // Refresh order detail
        op.fetchOrderDetail(orderId);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim rating: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _submittingRating = false);
    }
  }
}
