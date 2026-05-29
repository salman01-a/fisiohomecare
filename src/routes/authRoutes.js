const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('role').optional().isIn(['patient', 'therapist']).withMessage('Role must be patient or therapist'),
], validate, register);

router.post('/login', [
  body('email').optional().isEmail(),
  body('password').optional(),
  body('firebase_uid').optional(),
], validate, login);

router.get('/me', authenticate, getMe);

module.exports = router;
