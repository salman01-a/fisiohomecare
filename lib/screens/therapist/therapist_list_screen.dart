import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/therapist_provider.dart';
import '../../utils/constants.dart';
import '../../utils/routes.dart';
import '../../widgets/therapist_card.dart';
import '../../widgets/loading_indicator.dart';

class TherapistListScreen extends StatefulWidget {
  final bool embedded;
  const TherapistListScreen({super.key, this.embedded = false});
  @override
  State<TherapistListScreen> createState() => _TherapistListScreenState();
}

class _TherapistListScreenState extends State<TherapistListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TherapistProvider>(context, listen: false).fetchTherapists();
    });
  }

  @override
  Widget build(BuildContext context) {
    final body = Consumer<TherapistProvider>(
      builder: (ctx, tp, _) {
        if (tp.isLoading) return const LoadingIndicator(message: 'Memuat terapis...');
        if (tp.error != null) return Center(child: Text('Error: ${tp.error}', style: const TextStyle(color: AppColors.error)));
        if (tp.therapists.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 64, color: AppColors.textMuted.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                const Text('Belum ada terapis tersedia', style: TextStyle(fontSize: 16, color: AppColors.textMuted)),
              ],
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => tp.fetchTherapists(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tp.therapists.length,
            itemBuilder: (ctx, i) {
              final t = tp.therapists[i];
              return TherapistCard(therapist: t, onTap: () => Navigator.pushNamed(context, AppRoutes.therapistDetail, arguments: t.id));
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
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text('Daftar Terapis', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ),
            Expanded(child: body),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Daftar Terapis')),
      body: body,
    );
  }
}
