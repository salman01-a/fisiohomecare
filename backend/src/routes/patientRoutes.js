const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getPatientRecords } = require('../controllers/recordController');

router.use(authenticate);
router.get('/:id/records', getPatientRecords);

module.exports = router;
