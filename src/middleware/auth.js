const { admin } = require('../config/firebase');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Supports Firebase ID Token and fallback JWT for development
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      // Support token via query string (for <img> tags that can't set headers)
      token = req.query.token;
    } else {
      throw ApiError.unauthorized('No token provided. Use Bearer <token>');
    }
    let firebaseUid = null;
    let decodedToken = null;

    // Try Firebase verification first
    try {
      if (admin.apps && admin.apps.length > 0) {
        decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
      } else {
        throw new Error('Firebase not initialized');
      }
    } catch (firebaseError) {
      // Fallback to JWT for development
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        firebaseUid = decodedToken.firebase_uid || null;
      } catch (jwtError) {
        throw ApiError.unauthorized('Invalid or expired token');
      }
    }

    // Find user in database
    let user;
    if (firebaseUid) {
      user = await User.findOne({ where: { firebase_uid: firebaseUid } });
    }
    if (!user && decodedToken && decodedToken.id) {
      user = await User.findByPk(decodedToken.id);
    }

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    req.user = user.toSafeJSON();
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    next(ApiError.unauthorized('Authentication failed'));
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
    }
    next();
  };
};

/**
 * Middleware untuk memastikan terapis sudah divalidasi admin (status: active)
 * Hanya berlaku untuk user dengan role 'therapist'
 * User dengan role lain (admin, patient) akan langsung lolos
 */
const requireValidatedTherapist = async (req, res, next) => {
  try {
    // Hanya cek jika user adalah terapis
    if (!req.user || req.user.role !== 'therapist') {
      return next();
    }

    const { Therapist } = require('../models');
    const therapist = await Therapist.findOne({ where: { user_id: req.user.id } });

    if (!therapist) {
      return next(ApiError.forbidden('Therapist profile not found'));
    }

    if (therapist.status === 'pending') {
      return next(ApiError.forbidden(
        'Akun terapis kamu belum divalidasi oleh admin. Silahkan tunggu proses validasi terlebih dahulu.'
      ));
    }

    if (therapist.status === 'suspended') {
      return next(ApiError.forbidden(
        'Akun terapis kamu telah disuspend. Hubungi admin klinik untuk informasi lebih lanjut.'
      ));
    }

    // Tambahkan data therapist ke req untuk dipakai controller
    req.therapist = therapist;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, authorize, requireValidatedTherapist };
