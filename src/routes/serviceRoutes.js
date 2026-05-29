const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { getAllServices, getServiceById, createService, updateService, deleteService } = require('../controllers/serviceController');

// List services (public setelah login)
router.get('/', authenticate, getAllServices);
router.get('/:id', authenticate, getServiceById);

// CRUD services (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isDecimal().withMessage('Valid price is required'),
  body('duration_minutes').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
], validate, createService);

router.put('/:id', authenticate, authorize('admin'), updateService);
router.delete('/:id', authenticate, authorize('admin'), deleteService);

module.exports = router;
