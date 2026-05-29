const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize, requireValidatedTherapist } = require('../middleware/auth');
const {
  getAllTherapists, getTherapistById, validateTherapist,
  getTherapistSchedules, createSchedule, deleteSchedule,
  getTherapistReviews,
} = require('../controllers/therapistController');

router.use(authenticate);

router.get('/', getAllTherapists);
router.get('/:id', getTherapistById);
router.get('/:id/reviews', getTherapistReviews);

router.put('/:id/validate', authorize('admin'), [
  body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended'),
], validate, validateTherapist);

router.get('/:id/schedules', getTherapistSchedules);

router.post('/:id/schedules', authorize('admin', 'therapist'), requireValidatedTherapist, [
  body('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('start_time').notEmpty().withMessage('Start time required'),
  body('end_time').notEmpty().withMessage('End time required'),
], validate, createSchedule);

router.delete('/:id/schedules/:scheduleId', authorize('admin', 'therapist'), requireValidatedTherapist, deleteSchedule);

module.exports = router;
