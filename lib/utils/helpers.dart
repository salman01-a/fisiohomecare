import 'package:intl/intl.dart';

class Helpers {
  /// Format currency in Indonesian Rupiah
  /// e.g. 150000 → "Rp 150.000"
  static String formatCurrency(dynamic amount) {
    final value =
        amount is String ? double.tryParse(amount) ?? 0 : (amount ?? 0);
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    return formatter.format(value);
  }

  /// Format date from ISO string or DateTime
  /// e.g. "2026-05-15" → "15 Mei 2026"
  static String formatDate(dynamic date) {
    if (date == null) return '-';
    DateTime dt;
    if (date is String) {
      dt = DateTime.parse(date);
    } else if (date is DateTime) {
      dt = date;
    } else {
      return '-';
    }
    return DateFormat('d MMMM yyyy', 'id_ID').format(dt);
  }

  /// Format date short
  /// e.g. "2026-05-15" → "15 Mei"
  static String formatDateShort(dynamic date) {
    if (date == null) return '-';
    DateTime dt;
    if (date is String) {
      dt = DateTime.parse(date);
    } else if (date is DateTime) {
      dt = date;
    } else {
      return '-';
    }
    return DateFormat('d MMM', 'id_ID').format(dt);
  }

  /// Format time from "HH:mm:ss" string
  /// e.g. "09:00:00" → "09:00"
  static String formatTime(String? time) {
    if (time == null || time.isEmpty) return '-';
    final parts = time.split(':');
    if (parts.length >= 2) {
      return '${parts[0]}:${parts[1]}';
    }
    return time;
  }

  /// Format datetime from ISO string
  /// e.g. "2026-05-15T09:30:00Z" → "15 Mei 2026, 09:30"
  static String formatDateTime(dynamic date) {
    if (date == null) return '-';
    DateTime dt;
    if (date is String) {
      dt = DateTime.parse(date);
    } else if (date is DateTime) {
      dt = date;
    } else {
      return '-';
    }
    return DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(dt.toLocal());
  }

  /// Capitalize first letter
  static String capitalize(String? text) {
    if (text == null || text.isEmpty) return '';
    return text[0].toUpperCase() + text.substring(1);
  }

  /// Get readable order status label
  static String orderStatusLabel(String? status) {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'otw':
        return 'Dalam Perjalanan';
      case 'ongoing':
        return 'Berlangsung';
      case 'done':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status ?? '-';
    }
  }

  /// Get readable payment status label
  static String paymentStatusLabel(String? status) {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'rejected':
        return 'Ditolak';
      default:
        return status ?? '-';
    }
  }
}
