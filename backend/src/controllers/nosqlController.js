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
 * Get notifications for the logged-in patient
 * GET /nosql/notifications
 */
const getMyNotifications = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') throw ApiError.forbidden('Only patients can access notifications');

    const notifications = await FirestoreService.getPatientNotifications(req.user.id);
    return ApiResponse.success(res, notifications, 'Notifications retrieved from NoSQL');
  } catch (error) { next(error); }
};

/**
 * Mark notification as read
 * PUT /nosql/notifications/:notif_id/read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') throw ApiError.forbidden('Only patients can access notifications');

    await FirestoreService.markNotificationRead(req.user.id, req.params.notif_id);
    return ApiResponse.success(res, null, 'Notification marked as read in NoSQL');
  } catch (error) { next(error); }
};

module.exports = {
  updateVisitTracking,
  getVisitTracking,
  getMyNotifications,
  markNotificationRead
};
