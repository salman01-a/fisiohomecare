import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../utils/routes.dart';
import '../../widgets/custom_button.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 16),
            // Avatar
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Center(child: Text(user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'P', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Colors.white))),
            ),
            const SizedBox(height: 14),
            Text(user?.name ?? 'Pasien', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(user?.email ?? '', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
            if (user?.phone != null) ...[
              const SizedBox(height: 2),
              Text(user!.phone!, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
            ],
            const SizedBox(height: 28),

            // Menu items
            _menuItem(context, Icons.receipt_long_outlined, 'Pesanan Saya', () => Navigator.pushNamed(context, AppRoutes.orderList)),
            _menuItem(context, Icons.medical_information_outlined, 'Rekam Terapi', () {
              // Navigate to records — needs patient ID
              // For now show a message
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fitur segera hadir')));
            }),
            _menuItem(context, Icons.info_outline, 'Tentang Aplikasi', () {
              showAboutDialog(
                context: context,
                applicationName: 'FisioHomecare',
                applicationVersion: '1.0.0',
                applicationLegalese: '© 2026 FisioHomecare',
              );
            }),
            const SizedBox(height: 24),

            CustomButton(
              text: 'Keluar',
              isOutlined: true,
              color: AppColors.error,
              icon: Icons.logout_rounded,
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Keluar?'),
                    content: const Text('Anda yakin ingin keluar dari akun?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                      TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Keluar', style: TextStyle(color: AppColors.error))),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await auth.logout();
                  if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (_) => false);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuItem(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: AppColors.primaryLight.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        onTap: onTap,
      ),
    );
  }
}
