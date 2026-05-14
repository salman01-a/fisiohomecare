const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Patient, Therapist, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Register a new patient user
 * POST /auth/register
 */
const register = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, phone, password, role, firebase_uid } = req.body;

    // Only patients can self-register; therapists also register but go through validation
    const allowedRoles = ['patient', 'therapist'];
    const userRole = role || 'patient';

    if (!allowedRoles.includes(userRole)) {
      throw ApiError.badRequest('Self-registration is only allowed for patients and therapists');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password dengan bcrypt
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      role: userRole,
      firebase_uid: firebase_uid || null,
      password_hash: passwordHash,
    }, { transaction: t });

    // Create role-specific profile
    if (userRole === 'patient') {
      const { address, medical_history, emergency_contact, dob } = req.body;
      await Patient.create({
        user_id: user.id,
        address,
        medical_history,
        emergency_contact,
        dob,
      }, { transaction: t });
    } else if (userRole === 'therapist') {
      const { license_number, license_doc_url, photo_url, specialization } = req.body;
      if (!license_number) {
        throw ApiError.badRequest('License number is required for therapist registration');
      }
      await Therapist.create({
        user_id: user.id,
        license_number,
        license_doc_url,
        photo_url,
        specialization,
        status: 'pending',
      }, { transaction: t });
    }

    await t.commit();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, firebase_uid: user.firebase_uid },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.created(res, {
      user: user.toSafeJSON(),
      token,
    }, 'Registration successful');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Login with email/password
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, firebase_uid } = req.body;

    // Firebase login flow: find user by firebase_uid
    if (firebase_uid) {
      const user = await User.findOne({ where: { firebase_uid } });
      if (!user) {
        throw ApiError.unauthorized('User not found. Please register first.');
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, firebase_uid: user.firebase_uid },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return ApiResponse.success(res, { user: user.toSafeJSON(), token }, 'Login successful');
    }

    // Email/password login (plain text comparison)
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }


    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, firebase_uid: user.firebase_uid },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ApiResponse.success(res, { user: user.toSafeJSON(), token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'therapistProfile' },
        { association: 'patientProfile' },
      ],
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return ApiResponse.success(res, user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
