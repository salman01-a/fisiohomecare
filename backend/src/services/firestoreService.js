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
    await docRef.set({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
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
}

module.exports = FirestoreService;
