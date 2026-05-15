import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/therapist_provider.dart';
import '../../utils/constants.dart';
import '../../utils/routes.dart';
import '../../widgets/order_card.dart';
import '../../widgets/therapist_card.dart';
import '../../widgets/loading_indicator.dart';
import '../therapist/therapist_list_screen.dart';
import '../order/order_list_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    _HomeTab(),
    TherapistListScreen(embedded: true),
    OrderListScreen(embedded: true),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, -4)),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Beranda'),
            BottomNavigationBarItem(icon: Icon(Icons.people_rounded), label: 'Terapis'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Pesanan'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
          ],
        ),
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  const _HomeTab();
  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TherapistProvider>(context, listen: false).fetchTherapists();
      Provider.of<OrderProvider>(context, listen: false).fetchOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    return SafeArea(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await Provider.of<TherapistProvider>(context, listen: false).fetchTherapists();
          await Provider.of<OrderProvider>(context, listen: false).fetchOrders();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Halo, ${auth.user?.name ?? 'Pasien'} 👋', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        const Text('Butuh fisioterapi? Pesan sekarang', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: AppColors.primaryLight.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(14)),
                    child: const Icon(Icons.person, color: AppColors.primary),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick action card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pesan Fisioterapi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                    const SizedBox(height: 6),
                    Text('Pilih terapis dan jadwal sesuai kebutuhan Anda', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.85))),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, AppRoutes.therapistList),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary, elevation: 0, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                      child: const Text('Cari Terapis', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Top therapists
              _sectionHeader('Terapis Tersedia', onSeeAll: () => Navigator.pushNamed(context, AppRoutes.therapistList)),
              const SizedBox(height: 12),
              Consumer<TherapistProvider>(
                builder: (ctx, tp, _) {
                  if (tp.isLoading) return const LoadingIndicator();
                  if (tp.therapists.isEmpty) return const Text('Belum ada terapis', style: TextStyle(color: AppColors.textMuted));
                  final top = tp.therapists.take(3).toList();
                  return Column(children: top.map((t) => TherapistCard(therapist: t, onTap: () => Navigator.pushNamed(context, AppRoutes.therapistDetail, arguments: t.id))).toList());
                },
              ),
              const SizedBox(height: 24),

              // Recent orders
              _sectionHeader('Pesanan Terbaru', onSeeAll: () => Navigator.pushNamed(context, AppRoutes.orderList)),
              const SizedBox(height: 12),
              Consumer<OrderProvider>(
                builder: (ctx, op, _) {
                  if (op.isLoading) return const LoadingIndicator();
                  if (op.orders.isEmpty) return const Text('Belum ada pesanan', style: TextStyle(color: AppColors.textMuted));
                  final recent = op.orders.take(3).toList();
                  return Column(children: recent.map((o) => OrderCard(order: o, onTap: () => Navigator.pushNamed(context, AppRoutes.orderDetail, arguments: o.id))).toList());
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, {VoidCallback? onSeeAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        if (onSeeAll != null)
          GestureDetector(onTap: onSeeAll, child: const Text('Lihat Semua', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary))),
      ],
    );
  }
}
