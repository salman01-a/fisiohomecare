import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/loading_indicator.dart';

/// Halaman Notifikasi Pasien
class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});
  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
      ),
      body: Consumer<NotificationProvider>(
        builder: (ctx, notifProv, _) {
          if (notifProv.isLoading) return const LoadingIndicator();

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => notifProv.fetchNotifications(),
            child: notifProv.notifications.isEmpty
                ? ListView(
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.5,
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.notifications_none_rounded, size: 64, color: AppColors.textMuted),
                            SizedBox(height: 16),
                            Text('Belum ada notifikasi', style: TextStyle(fontSize: 16, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                            SizedBox(height: 6),
                            Text('Notifikasi akan muncul saat ada update pesanan', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: notifProv.notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final notif = notifProv.notifications[i];
                      final isRead = notif['is_read'] == true;
                      final type = notif['type'] ?? 'info';

                      return Card(
                        color: isRead ? null : AppColors.primary.withValues(alpha: 0.03),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: isRead ? AppColors.border : AppColors.primary.withValues(alpha: 0.3),
                            width: isRead ? 1 : 1.5,
                          ),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () {
                            if (!isRead && notif['id'] != null) {
                              notifProv.markAsRead(notif['id'], i);
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(
                                    color: _typeColor(type).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(_typeIcon(type), color: _typeColor(type), size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              notif['title'] ?? 'Notifikasi',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                          ),
                                          if (!isRead)
                                            Container(
                                              width: 8, height: 8,
                                              decoration: const BoxDecoration(
                                                color: AppColors.primary,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        notif['message'] ?? '',
                                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                                      ),
                                      if (notif['created_at'] != null) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          _formatFirestoreTimestamp(notif['created_at']),
                                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          );
        },
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'success': return AppColors.success;
      case 'warning': return AppColors.warning;
      case 'error': return AppColors.error;
      default: return AppColors.info;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'success': return Icons.check_circle_outline;
      case 'warning': return Icons.warning_amber_rounded;
      case 'error': return Icons.error_outline;
      default: return Icons.info_outline;
    }
  }

  String _formatFirestoreTimestamp(dynamic timestamp) {
    try {
      if (timestamp is Map && timestamp['_seconds'] != null) {
        final dt = DateTime.fromMillisecondsSinceEpoch(
          (timestamp['_seconds'] as num).toInt() * 1000,
        );
        return Helpers.formatDateTime(dt);
      }
      return Helpers.formatDateTime(timestamp);
    } catch (_) {
      return '-';
    }
  }
}
