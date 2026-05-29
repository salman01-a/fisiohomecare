const { getFirestore, admin } = require('../config/firebase');

/**
 * Service untuk operasi NoSQL (Firestore)
 * Sesuai requirement: "NoSQL: untuk menyimpan catatan terapi fleksibel, progres pemulihan, foto/dokumen pendukung, tracking kunjungan, dan notifikasi pasien."
 */
class FirestoreService {
  /**
   * Menyimpan/mengupdate catatan terapi fleksibel (progress notes, foto pendukung, dll)
   * Koleksi: therapy_notes
   * Document ID: berdasarkan record_id dari SQL (agar terhubung)
   */
  static async saveTherapyNote(recordId, data) {
    const db = getFirestore();
    if (!db) return null; // Fallback jika firebase tidak terkonfigurasi

    const docRef = db.collection('therapy_notes').doc(recordId.toString());
    
    // Tetap update top-level fields (agar API/frontend lama tidak error), 
    // tapi sekaligus simpan riwayat di dalam array 'history' agar tidak ada data yang terhapus (overwrite)
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
      history: admin.firestore.FieldValue.arrayUnion({
        flexible_notes: data.flexible_notes || '',
        progress_rating: data.progress_rating || 0,
        attachments: data.attachments || [],
        timestamp: new Date(),
      })
    }, { merge: true });

    return { id: docRef.id, ...data };
  }

  /**
   * Mengambil catatan terapi fleksibel berdasarkan record_id
   */
  static async getTherapyNote(recordId) {
    const db = getFirestore();
    if (!db) return null;

    const doc = await db.collection('therapy_notes').doc(recordId.toString()).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Tracking Kunjungan (Visit Tracking)
   * Menyimpan log realtime seperti: Terapis OTW, Terapis Tiba, Mulai Terapi, Selesai Terapi
   * Koleksi: visit_tracking
   */
  static async logVisitTracking(orderId, status, location, notes = '') {
    const db = getFirestore();
    if (!db) return null;

    const docRef = db.collection('visit_tracking').doc(orderId.toString());
    
    // Simpan ke array tracking_history
    await docRef.set({
      order_id: orderId,
      current_status: status,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
      history: admin.firestore.FieldValue.arrayUnion({
        status,
        location,
        notes,
        timestamp: new Date(),
      })
    }, { merge: true });

    return true;
  }

  /**
   * Mengambil tracking history untuk suatu order
   */
  static async getVisitTracking(orderId) {
    const db = getFirestore();
    if (!db) return null;

    const doc = await db.collection('visit_tracking').doc(orderId.toString()).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Membuat notifikasi untuk pasien (push notification simulation & in-app storage)
   * Koleksi: notifications (sub-collection per patient_id)
   */
  static async sendPatientNotification(patientId, title, message, type = 'info') {
    const db = getFirestore();
    if (!db) return null;

    const notifRef = db.collection('patients').doc(patientId.toString()).collection('notifications').doc();
    
    const notification = {
      title,
      message,
      type,
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await notifRef.set(notification);
    
    return { id: notifRef.id, ...notification };
  }

  /**
   * Mengambil notifikasi pasien
   */
  static async getPatientNotifications(patientId, limit = 20) {
    const db = getFirestore();
    if (!db) return [];

    const snapshot = await db.collection('patients')
      .doc(patientId.toString())
      .collection('notifications')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  /**
   * Tandai notifikasi sudah dibaca
   */
  static async markNotificationRead(patientId, notifId) {
    const db = getFirestore();
    if (!db) return null;

    const notifRef = db.collection('patients')
      .doc(patientId.toString())
      .collection('notifications')
      .doc(notifId);

    await notifRef.update({ is_read: true });
    return true;
  }

  // ============ User-based Notifications (for admin/therapist) ============

  /**
   * Send notification to any user (admin, therapist, etc.)
   * Collection: users/{userId}/notifications
   */
  static async sendUserNotification(userId, title, message, type = 'info') {
    const db = getFirestore();
    if (!db) return null;

    const notifRef = db.collection('users').doc(userId.toString()).collection('notifications').doc();
    const notification = {
      title,
      message,
      type,
      is_read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await notifRef.set(notification);
    return { id: notifRef.id, ...notification };
  }

  /**
   * Get notifications for any user
   */
  static async getUserNotifications(userId, limit = 30) {
    const db = getFirestore();
    if (!db) return [];

    const snapshot = await db.collection('users')
      .doc(userId.toString())
      .collection('notifications')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Mark user notification as read
   */
  static async markUserNotificationRead(userId, notifId) {
    const db = getFirestore();
    if (!db) return null;

    const notifRef = db.collection('users')
      .doc(userId.toString())
      .collection('notifications')
      .doc(notifId);

    await notifRef.update({ is_read: true });
    return true;
  }

  // ============ Activity Logs ============

  /**
   * Log aktivitas user ke Firestore
   * Koleksi: activity_logs
   */
  static async logActivity(userId, userName, action, description, metadata = {}) {
    const db = getFirestore();
    if (!db) return null;

    const logRef = db.collection('activity_logs').doc();
    const logData = {
      user_id: userId,
      user_name: userName,
      action,
      description,
      metadata,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await logRef.set(logData);
    return { id: logRef.id, ...logData };
  }

  /**
   * Ambil activity logs (untuk admin dashboard)
   */
  static async getActivityLogs(limit = 50) {
    const db = getFirestore();
    if (!db) return [];

    const snapshot = await db.collection('activity_logs')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Ambil activity logs milik user tertentu
   */
  static async getActivityLogsByUser(userId, limit = 30) {
    const db = getFirestore();
    if (!db) return [];

    const snapshot = await db.collection('activity_logs')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = FirestoreService;
