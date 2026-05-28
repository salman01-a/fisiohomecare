import 'package:flutter/material.dart';
import '../models/order.dart';
import '../utils/constants.dart';
import '../utils/helpers.dart';
import '../utils/routes.dart';
import 'status_badge.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback? onTap;

  const OrderCard({super.key, required this.order, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: service name + status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      order.service?.name ?? order.serviceType ?? 'Fisioterapi',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 12),
              // Therapist name
              _infoRow(
                Icons.person_outline,
                order.therapist?.displayName ?? 'Terapis',
              ),
              const SizedBox(height: 6),
              // Schedule
              if (order.schedule != null) ...[
                _infoRow(
                  Icons.calendar_today_outlined,
                  '${Helpers.formatDate(order.schedule!.date)} • ${Helpers.formatTime(order.schedule!.startTime)}',
                ),
                const SizedBox(height: 6),
              ],
              // Address
              _infoRow(
                Icons.location_on_outlined,
                order.address,
                maxLines: 2,
              ),
              // Price
              if (order.service != null) ...[
                const SizedBox(height: 8),
                const Divider(height: 1),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      Helpers.formatCurrency(order.service!.price),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
              // ── Done: Therapy Record preview + Rating ──
              if (order.status == 'done') ...[
                const SizedBox(height: 8),
                const Divider(height: 1),
                const SizedBox(height: 10),

                // Therapy record preview
                if (order.therapyRecord != null)
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(
                      context,
                      AppRoutes.recordDetail,
                      arguments: order.therapyRecord!.id,
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.medical_information_outlined,
                                  size: 16, color: AppColors.success),
                              const SizedBox(width: 6),
                              const Text(
                                'Rekam Terapi',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.success,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                'Sesi ${order.therapyRecord!.sessionNumber}',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.success.withValues(alpha: 0.7),
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.chevron_right_rounded,
                                  size: 16,
                                  color: AppColors.success.withValues(alpha: 0.7)),
                            ],
                          ),
                          if (order.therapyRecord!.diagnosis != null &&
                              order.therapyRecord!.diagnosis!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            _recordInfoRow(
                                'Diagnosis', order.therapyRecord!.diagnosis!),
                          ],
                          if (order.therapyRecord!.chiefComplaint != null &&
                              order.therapyRecord!.chiefComplaint!
                                  .isNotEmpty) ...[
                            const SizedBox(height: 4),
                            _recordInfoRow(
                                'Keluhan', order.therapyRecord!.chiefComplaint!),
                          ],
                        ],
                      ),
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.hourglass_empty_rounded,
                            size: 16, color: AppColors.textMuted),
                        SizedBox(width: 6),
                        Text(
                          'Rekam terapi belum tersedia',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Rating stars
                if (order.rating != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Text('Rating: ',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      ...List.generate(
                          order.rating!,
                          (i) => const Icon(Icons.star_rounded,
                              size: 16, color: AppColors.warning)),
                      ...List.generate(
                          5 - order.rating!,
                          (i) => const Icon(Icons.star_border_rounded,
                              size: 16, color: AppColors.textMuted)),
                    ],
                  ),
                ],
              ],

              // ── Active orders: live status indicator ──
              if (_isActiveStatus(order.status)) ...[
                const SizedBox(height: 8),
                const Divider(height: 1),
                const SizedBox(height: 8),
                _buildLiveStatusIndicator(order.status),
              ],
            ],
          ),
        ),
      ),
    );
  }

  bool _isActiveStatus(String status) {
    return status == 'confirmed' || status == 'otw' || status == 'ongoing';
  }

  Widget _buildLiveStatusIndicator(String status) {
    final (label, icon, color) = switch (status) {
      'confirmed' => ('Menunggu terapis berangkat', Icons.check_circle_outline, AppColors.info),
      'otw' => ('Terapis dalam perjalanan', Icons.directions_car_rounded, AppColors.warning),
      'ongoing' => ('Terapi sedang berlangsung', Icons.play_circle_outline_rounded, AppColors.success),
      _ => ('', Icons.info, AppColors.textMuted),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          _PulsingDot(color: color),
          const SizedBox(width: 8),
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
          Text(
            'LIVE',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _recordInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: AppColors.success.withValues(alpha: 0.6),
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _infoRow(IconData icon, String text, {int maxLines = 1}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// Animated pulsing dot for live status
class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (ctx, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: _animation.value),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: _animation.value * 0.4),
                blurRadius: 6,
                spreadRadius: 1,
              ),
            ],
          ),
        );
      },
    );
  }
}
