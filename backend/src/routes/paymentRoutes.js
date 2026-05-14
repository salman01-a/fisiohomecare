const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { initiatePayment, confirmPayment, getPaymentByOrderId } = require('../controllers/paymentController');

router.use(authenticate);

router.post('/initiate', authorize('patient'), [
  body('order_id').isInt().withMessage('Valid order_id required'),
  body('amount').isDecimal().withMessage('Valid amount required'),
  body('method').isIn(['transfer', 'cash']).withMessage('Method must be transfer or cash'),
], validate, initiatePayment);

router.patch('/:order_id/confirm', authorize('admin'), [
  body('status').isIn(['confirmed', 'rejected']).withMessage('Status must be confirmed or rejected'),
], validate, confirmPayment);

router.get('/:order_id', getPaymentByOrderId);

module.exports = router;
