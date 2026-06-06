import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../utils/routes.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _emergencyCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _emergencyCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      await auth.register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        address: _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
        emergencyContact: _emergencyCtrl.text.trim().isEmpty ? null : _emergencyCtrl.text.trim(),
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(auth.error ?? 'Registrasi gagal'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Daftar Akun Pasien')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Buat akun baru', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text('Isi data diri Anda untuk memulai', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 28),
                CustomTextField(label: 'Nama Lengkap *', hint: 'Masukkan nama lengkap', controller: _nameCtrl, prefixIcon: Icons.person_outline, validator: (v) => v == null || v.isEmpty ? 'Nama wajib diisi' : null),
                const SizedBox(height: 16),
                CustomTextField(label: 'Email *', hint: 'contoh@email.com', controller: _emailCtrl, keyboardType: TextInputType.emailAddress, prefixIcon: Icons.email_outlined, validator: (v) => v == null || !v.contains('@') ? 'Email tidak valid' : null),
                const SizedBox(height: 16),
                CustomTextField(label: 'Password *', hint: 'Minimal 6 karakter', controller: _passCtrl, obscureText: true, prefixIcon: Icons.lock_outline, validator: (v) => v != null && v.length < 6 ? 'Minimal 6 karakter' : null),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                const Text('Informasi Tambahan (Opsional)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                CustomTextField(label: 'Nomor Telepon', hint: '08xxxxxxxxxx', controller: _phoneCtrl, keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
                const SizedBox(height: 16),
                CustomTextField(label: 'Alamat Rumah', hint: 'Alamat lengkap', controller: _addressCtrl, maxLines: 2, prefixIcon: Icons.location_on_outlined),
                const SizedBox(height: 16),
                CustomTextField(label: 'Kontak Darurat', hint: 'Nama & nomor telepon', controller: _emergencyCtrl, prefixIcon: Icons.emergency_outlined),
                const SizedBox(height: 32),
                Consumer<AuthProvider>(builder: (ctx, auth, _) => CustomButton(text: 'Daftar', onPressed: _register, isLoading: auth.isLoading, icon: Icons.person_add_alt_1_rounded)),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
