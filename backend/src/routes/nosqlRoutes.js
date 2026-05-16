const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const nosqlController = require('../controllers/nosqlController');

router.use(authenticate);

// Visit Tracking (Terapis bisa update, Pasien/Admin bisa lihat)
router.post('/tracking/:order_id', authorize('therapist', 'admin'), nosqlController.updateVisitTracking);
router.get('/tracking/:order_id', nosqlController.getVisitTracking);

// Notifications (Pasien)
router.get('/notifications', authorize('patient'), nosqlController.getMyNotifications);
router.put('/notifications/:notif_id/read', authorize('patient'), nosqlController.markNotificationRead);

module.exports = router;
