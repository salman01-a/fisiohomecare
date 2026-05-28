import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/therapist_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../utils/routes.dart';
import '../../widgets/loading_indicator.dart';
import '../../config/api_config.dart';

class TherapistDetailScreen extends StatefulWidget {
  const TherapistDetailScreen({super.key});
  @override
  State<TherapistDetailScreen> createState() => _TherapistDetailScreenState();
}

class _TherapistDetailScreenState extends State<TherapistDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ModalRoute.of(context)!.settings.arguments as String;
      final tp = Provider.of<TherapistProvider>(context, listen: false);
      tp.fetchTherapistDetail(id);
      tp.fetchSchedules(id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Terapis')),
      body: Consumer<TherapistProvider>(
        builder: (ctx, tp, _) {
          if (tp.isLoading)
            return const LoadingIndicator(message: 'Memuat detail...');
          final t = tp.selectedTherapist;
          if (t == null)
            return const Center(child: Text('Terapis tidak ditemukan'));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile header
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: t.photoUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Image.network(
                                  ApiConfig.getImageUrl(t.photoUrl),
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      const Icon(
                                        Icons.person,
                                        size: 40,
                                        color: AppColors.primary,
                                      ),
                                ),
                              )
                            : const Icon(
                                Icons.person,
                                size: 40,
                                color: AppColors.primary,
                              ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        t.displayName,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (t.specialization != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          t.specialization!,
                          style: const TextStyle(
                            fontSize: 15,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            color: Color(0xFFFBBF24),
                            size: 20,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            t.rating.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Info cards
                _infoTile(Icons.badge_outlined, 'No. STR', t.licenseNumber),
                if (t.user?.phone != null)
                  _infoTile(Icons.phone_outlined, 'Telepon', t.user!.phone!),
                if (t.user?.email != null)
                  _infoTile(Icons.email_outlined, 'Email', t.user!.email),
                const SizedBox(height: 24),

                // Available schedules
                const Text(
                  'Jadwal Tersedia',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                if (tp.schedules.isEmpty)
                  const Text(
                    'Tidak ada jadwal tersedia',
                    style: TextStyle(color: AppColors.textMuted),
                  )
                else
                  ...tp.schedules.map(
                    (s) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight.withValues(
                              alpha: 0.15,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.schedule,
                            color: AppColors.primary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          Helpers.formatDate(s.date),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Text(
                          '${Helpers.formatTime(s.startTime)} - ${Helpers.formatTime(s.endTime)}',
                          style: const TextStyle(fontSize: 13),
                        ),
                        trailing: ElevatedButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            AppRoutes.createOrder,
                            arguments: {'therapist': t, 'schedule': s},
                          ),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                          ),
                          child: const Text(
                            'Pesan',
                            style: TextStyle(fontSize: 13),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textMuted),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
