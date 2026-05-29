const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize, requireValidatedTherapist } = require('../middleware/auth');
const {
  getAllOrders, createOrder, getOrderById, updateOrderStatus, cancelOrder, rateOrder,
} = require('../controllers/orderController');

router.use(authenticate);

router.get('/', getAllOrders);

router.post('/', authorize('patient'), [
  body('therapist_id').isInt().withMessage('Valid therapist_id required'),
  body('schedule_id').isInt().withMessage('Valid schedule_id required'),
  body('service_type').notEmpty().withMessage('Service type required'),
  body('address').notEmpty().withMessage('Address required'),
], validate, createOrder);

router.get('/:id', getOrderById);

router.put('/:id/status', authorize('admin', 'therapist'), requireValidatedTherapist, [
  body('status').isIn(['pending', 'confirmed', 'otw', 'ongoing', 'done', 'cancelled'])
    .withMessage('Invalid status'),
], validate, updateOrderStatus);

router.delete('/:id', cancelOrder);

router.post('/:id/rate', authorize('patient'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
], validate, rateOrder);

module.exports = router;
