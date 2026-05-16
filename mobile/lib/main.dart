import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/therapist_provider.dart';
import 'providers/order_provider.dart';
import 'providers/service_provider.dart';
import 'utils/constants.dart';
import 'utils/routes.dart';

import 'screens/splash/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/therapist/therapist_list_screen.dart';
import 'screens/therapist/therapist_detail_screen.dart';
import 'screens/order/create_order_screen.dart';
import 'screens/order/order_list_screen.dart';
import 'screens/order/order_detail_screen.dart';
import 'screens/payment/payment_screen.dart';
import 'screens/record/record_list_screen.dart';
import 'screens/record/record_detail_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/notification/notification_screen.dart';

import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID', null);
  runApp(const FisioHomecareApp());
}

class FisioHomecareApp extends StatelessWidget {
  const FisioHomecareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => TherapistProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => ServiceProvider()),
      ],
      child: MaterialApp(
        title: 'FisioHomecare',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        initialRoute: AppRoutes.splash,
        routes: {
          AppRoutes.splash: (_) => const SplashScreen(),
          AppRoutes.login: (_) => const LoginScreen(),
          AppRoutes.register: (_) => const RegisterScreen(),
          AppRoutes.home: (_) => const HomeScreen(),
          AppRoutes.therapistList: (_) => const TherapistListScreen(),
          AppRoutes.therapistDetail: (_) => const TherapistDetailScreen(),
          AppRoutes.createOrder: (_) => const CreateOrderScreen(),
          AppRoutes.orderList: (_) => const OrderListScreen(),
          AppRoutes.orderDetail: (_) => const OrderDetailScreen(),
          AppRoutes.payment: (_) => const PaymentScreen(),
          AppRoutes.recordList: (_) => const RecordListScreen(),
          AppRoutes.recordDetail: (_) => const RecordDetailScreen(),
          AppRoutes.profile: (_) => const ProfileScreen(),
          AppRoutes.notifications: (_) => const NotificationScreen(),
        },
      ),
    );
  }
}
