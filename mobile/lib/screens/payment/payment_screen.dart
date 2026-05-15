import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/order.dart';
import '../../services/payment_service.dart';
import '../../services/upload_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/custom_button.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final PaymentService _paymentService = PaymentService();
  final UploadService _uploadService = UploadService();
  String _method = 'transfer';
  File? _proofFile;
  bool _isLoading = false;

  Future<void> _pickProof() async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (img != null) setState(() => _proofFile = File(img.path));
  }

  Future<void> _submit(Order order) async {
    if (_method == 'transfer' && _proofFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload bukti transfer'), backgroundColor: AppColors.warning));
      return;
    }
    setState(() => _isLoading = true);
    try {
      String? proofUrl;
      if (_proofFile != null) {
        proofUrl = await _uploadService.uploadPaymentProof(_proofFile!);
      }
      await _paymentService.initiate(orderId: order.id, amount: order.service?.price ?? 0, method: _method, proofUrl: proofUrl);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pembayaran berhasil dikirim!'), backgroundColor: AppColors.success));
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = ModalRoute.of(context)!.settings.arguments as Order;
    return Scaffold(
      appBar: AppBar(title: const Text('Pembayaran')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Amount card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text('Total Pembayaran', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    Text(Helpers.formatCurrency(order.service?.price ?? 0), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.primary)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Payment method
            const Text('Metode Pembayaran', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            _methodTile('transfer', 'Transfer Bank', Icons.account_balance_outlined),
            _methodTile('cash', 'Tunai', Icons.money),
            const SizedBox(height: 20),

            // Upload proof
            if (_method == 'transfer') ...[
              const Text('Bukti Transfer', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _pickProof,
                child: Container(
                  width: double.infinity, height: 160,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                  ),
                  child: _proofFile != null
                      ? ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(_proofFile!, fit: BoxFit.cover))
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.cloud_upload_outlined, size: 40, color: AppColors.textMuted),
                            SizedBox(height: 8),
                            Text('Tap untuk upload bukti', style: TextStyle(color: AppColors.textMuted)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            CustomButton(text: 'Kirim Pembayaran', onPressed: () => _submit(order), isLoading: _isLoading, icon: Icons.send_rounded),
          ],
        ),
      ),
    );
  }

  Widget _methodTile(String value, String label, IconData icon) {
    final selected = _method == value;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2 : 1)),
      color: selected ? AppColors.primary.withValues(alpha: 0.04) : null,
      child: ListTile(
        leading: Icon(icon, color: selected ? AppColors.primary : AppColors.textMuted),
        title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? AppColors.primary : AppColors.textPrimary)),
        trailing: selected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
        onTap: () => setState(() => _method = value),
      ),
    );
  }
}
