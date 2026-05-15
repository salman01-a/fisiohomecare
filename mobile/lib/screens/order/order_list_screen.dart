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

class _OrderListScreenState extends State<OrderListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OrderProvider>(context, listen: false).fetchOrders();
    });
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
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: op.orders.length,
            itemBuilder: (ctx, i) {
              final o = op.orders[i];
              return OrderCard(order: o, onTap: () => Navigator.pushNamed(context, AppRoutes.orderDetail, arguments: o.id));
            },
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
