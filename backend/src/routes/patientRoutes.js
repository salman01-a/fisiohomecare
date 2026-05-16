const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { getPatientRecords } = require('../controllers/recordController');
const {
  getMyProfile, updateMyProfile, getMyOrders, getMyRecords, getAllPatients,
} = require('../controllers/patientController');

router.use(authenticate);

// Admin: list all patients
router.get('/', authorize('admin'), getAllPatients);

// Patient self-service routes (for Mobile App)
router.get('/me', authorize('patient'), getMyProfile);
router.put('/me', authorize('patient'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
], validate, updateMyProfile);
router.get('/me/orders', authorize('patient'), getMyOrders);
router.get('/me/records', authorize('patient'), getMyRecords);

// Admin: get records of specific patient
router.get('/:id/records', authorize('admin', 'therapist'), getPatientRecords);

module.exports = router;
