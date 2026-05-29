const FirestoreService = require('../services/firestoreService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Update visit tracking for an order
 * POST /nosql/tracking/:order_id
 */
const updateVisitTracking = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) throw ApiError.badRequest('Status is required');

    await FirestoreService.logVisitTracking(order_id, status, location || {}, notes);
    
    return ApiResponse.success(res, null, 'Visit tracking updated successfully in NoSQL');
  } catch (error) { next(error); }
};

/**
 * Get visit tracking for an order
 * GET /nosql/tracking/:order_id
 */
const getVisitTracking = async (req, res, next) => {
  try {
    const tracking = await FirestoreService.getVisitTracking(req.params.order_id);
    if (!tracking) throw ApiError.notFound('No tracking data found for this order');

    return ApiResponse.success(res, tracking, 'Visit tracking retrieved from NoSQL');
  } catch (error) { next(error); }
};

/**
 * Get notifications for the logged-in user
 * GET /nosql/notifications
 * 
 * PENTING: Untuk patient, notifikasi disimpan di Firestore pakai patient.id (dari tabel patients),
 * BUKAN user.id (dari tabel users). Jadi harus lookup Patient dulu.
 */
const getMyNotifications = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      // Cari Patient record berdasarkan user_id untuk mendapatkan patient.id yang benar
      const { Patient } = require('../models');
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient) {
        return ApiResponse.success(res, [], 'No patient profile found');
      }
      const notifications = await FirestoreService.getPatientNotifications(patient.id);
      return ApiResponse.success(res, notifications, 'Notifications retrieved from NoSQL');
    }
    // Admin / Therapist — use user-based notifications
    const notifications = await FirestoreService.getUserNotifications(req.user.id);
    return ApiResponse.success(res, notifications, 'Notifications retrieved from NoSQL');
  } catch (error) { next(error); }
};

/**
 * Mark notification as read
 * PUT /nosql/notifications/:notif_id/read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    if (req.user.role === 'patient') {
      const { Patient } = require('../models');
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient) {
        return ApiResponse.success(res, null, 'No patient profile found');
      }
      await FirestoreService.markNotificationRead(patient.id, req.params.notif_id);
    } else {
      await FirestoreService.markUserNotificationRead(req.user.id, req.params.notif_id);
    }
    return ApiResponse.success(res, null, 'Notification marked as read in NoSQL');
  } catch (error) { next(error); }
};

/**
 * Get activity logs (admin only)
 * GET /nosql/activity-logs
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await FirestoreService.getActivityLogs(limit);
    return ApiResponse.success(res, logs, 'Activity logs retrieved from NoSQL');
  } catch (error) { next(error); }
};

/**
 * Get activity logs milik user yang sedang login
 * GET /nosql/my-activity-logs
 */
const getMyActivityLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await FirestoreService.getActivityLogsByUser(req.user.id, limit);
    return ApiResponse.success(res, logs, 'User activity logs retrieved from NoSQL');
  } catch (error) { next(error); }
};

module.exports = {
  updateVisitTracking,
  getVisitTracking,
  getMyNotifications,
  markNotificationRead,
  getActivityLogs,
  getMyActivityLogs,
};
