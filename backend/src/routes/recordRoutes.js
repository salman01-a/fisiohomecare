const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize, requireValidatedTherapist } = require('../middleware/auth');
const { createRecord, getRecordById, getPatientRecords } = require('../controllers/recordController');

router.use(authenticate);

router.post('/', authorize('therapist'), requireValidatedTherapist, [
  body('order_id').isInt().withMessage('Valid order_id required'),
], validate, createRecord);

router.get('/:id', getRecordById);

module.exports = router;
