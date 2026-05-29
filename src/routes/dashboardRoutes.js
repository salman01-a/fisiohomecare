const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getDashboardOrders } = require('../controllers/dashboardController');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/orders', getDashboardOrders);

module.exports = router;
