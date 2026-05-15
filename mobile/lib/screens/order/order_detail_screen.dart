import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';
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

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = ModalRoute.of(context)!.settings.arguments as String;
    Provider.of<OrderProvider>(context, listen: false).fetchOrderDetail(id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: Consumer<OrderProvider>(
        builder: (ctx, op, _) {
          if (op.isLoading) return const LoadingIndicator();
          final o = op.selectedOrder;
          if (o == null) return const Center(child: Text('Pesanan tidak ditemukan'));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
}
