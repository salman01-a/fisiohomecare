import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/therapist.dart';
import '../../models/schedule.dart';
import '../../models/service.dart';
import '../../providers/order_provider.dart';
import '../../providers/service_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../utils/routes.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/service_card.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});
  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final _addressCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  Service? _selectedService;
  Therapist? _therapist;
  Schedule? _schedule;
  bool _argsLoaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      setState(() {
        _therapist = args['therapist'] as Therapist;
        _schedule = args['schedule'] as Schedule;
        _argsLoaded = true;
      });
      Provider.of<ServiceProvider>(context, listen: false).fetchServices();
    });
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_therapist == null || _schedule == null) return;
    if (_addressCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Alamat wajib diisi'), backgroundColor: AppColors.error));
      return;
    }
    final op = Provider.of<OrderProvider>(context, listen: false);
    try {
      await op.createOrder(
        therapistId: _therapist!.id,
        scheduleId: _schedule!.id,
        serviceId: _selectedService?.id,
        serviceType: _selectedService?.name,
        address: _addressCtrl.text.trim(),
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pesanan berhasil dibuat!'), backgroundColor: AppColors.success));
      Navigator.popUntil(context, (r) => r.settings.name == AppRoutes.home || r.isFirst);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(op.error ?? 'Gagal membuat pesanan'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Guard: show loader until args are parsed after first frame
    if (!_argsLoaded) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Buat Pesanan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Ringkasan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    _summaryRow('Terapis', _therapist!.displayName),
                    _summaryRow('Tanggal', Helpers.formatDate(_schedule!.date)),
                    _summaryRow('Waktu', '${Helpers.formatTime(_schedule!.startTime)} - ${Helpers.formatTime(_schedule!.endTime)}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Service selection
            const Text('Pilih Layanan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Consumer<ServiceProvider>(
              builder: (ctx, sp, _) {
                if (sp.isLoading) return const Center(child: CircularProgressIndicator());
                return Column(
                  children: sp.services.map((s) => ServiceCard(service: s, isSelected: _selectedService?.id == s.id, onTap: () => setState(() => _selectedService = s))).toList(),
                );
              },
            ),
            const SizedBox(height: 20),

            CustomTextField(label: 'Alamat Kunjungan *', hint: 'Masukkan alamat lengkap', controller: _addressCtrl, maxLines: 3, prefixIcon: Icons.location_on_outlined),
            const SizedBox(height: 16),
            CustomTextField(label: 'Catatan (Opsional)', hint: 'Keluhan atau informasi tambahan', controller: _notesCtrl, maxLines: 3, prefixIcon: Icons.note_outlined),
            const SizedBox(height: 24),

            if (_selectedService != null) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Biaya', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(Helpers.formatCurrency(_selectedService!.price), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary)),
                ],
              ),
              const SizedBox(height: 20),
            ],

            Consumer<OrderProvider>(
              builder: (ctx, op, _) => CustomButton(text: 'Buat Pesanan', onPressed: _submit, isLoading: op.isLoading, icon: Icons.check_circle_outline),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
