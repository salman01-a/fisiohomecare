import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/order_provider.dart';
import '../../utils/constants.dart';
import '../../utils/routes.dart';
import '../../widgets/order_card.dart';
import '../../widgets/loading_indicator.dart';

class OrderListScreen extends StatefulWidget {
  final bool embedded;
  const OrderListScreen({super.key, this.embedded = false});
  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> with WidgetsBindingObserver {
  late OrderProvider _orderProvider;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _orderProvider = Provider.of<OrderProvider>(context, listen: false);
      _orderProvider.fetchOrders();
      _orderProvider.startPolling(); // Start live updates
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Only stop polling if this is the standalone screen (not embedded in HomeScreen)
    if (!widget.embedded) {
      _orderProvider.stopPolling();
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final op = Provider.of<OrderProvider>(context, listen: false);
    if (state == AppLifecycleState.paused) {
      op.stopPolling();
    } else if (state == AppLifecycleState.resumed) {
      op.startPolling();
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = Consumer<OrderProvider>(
      builder: (ctx, op, _) {
        if (op.isLoading) return const LoadingIndicator(message: 'Memuat pesanan...');
        if (op.orders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.textMuted.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                const Text('Belum ada pesanan', style: TextStyle(fontSize: 16, color: AppColors.textMuted)),
              ],
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => op.fetchOrders(),
          child: Column(
            children: [
              // Live status indicator bar
              if (op.isPolling)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  color: AppColors.success.withValues(alpha: 0.08),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: AppColors.success.withValues(alpha: 0.4), blurRadius: 4)],
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Status pesanan diperbarui otomatis',
                        style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: op.orders.length,
                  itemBuilder: (ctx, i) {
                    final o = op.orders[i];
                    return OrderCard(order: o, onTap: () => Navigator.pushNamed(context, AppRoutes.orderDetail, arguments: o.id));
                  },
                ),
              ),
            ],
          ),
        );
      },
    );

    if (widget.embedded) {
      return SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(padding: EdgeInsets.fromLTRB(20, 16, 20, 8), child: Text('Pesanan Saya', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700))),
            Expanded(child: body),
          ],
        ),
      );
    }

    return Scaffold(appBar: AppBar(title: const Text('Pesanan Saya')), body: body);
  }
}
