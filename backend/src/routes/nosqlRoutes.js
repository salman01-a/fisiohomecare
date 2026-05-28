const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const nosqlController = require('../controllers/nosqlController');

router.use(authenticate);

// Visit Tracking (Terapis bisa update, Pasien/Admin bisa lihat)
router.post('/tracking/:order_id', authorize('therapist', 'admin'), nosqlController.updateVisitTracking);
router.get('/tracking/:order_id', nosqlController.getVisitTracking);

// Notifications (Semua role bisa akses notifikasinya masing-masing)
router.get('/notifications', nosqlController.getMyNotifications);
router.put('/notifications/:notif_id/read', nosqlController.markNotificationRead);

// Activity Logs (user's own)
router.get('/my-activity-logs', nosqlController.getMyActivityLogs);

// Activity Logs (Admin only)
router.get('/activity-logs', authorize('admin'), nosqlController.getActivityLogs);

module.exports = router;
