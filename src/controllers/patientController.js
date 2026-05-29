const { Patient, User, Order, Payment, TherapyRecord, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get my patient profile (for patient role - used by mobile app)
 * GET /patients/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      where: { user_id: req.user.id },
      include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone', 'created_at'] }],
    });

    if (!patient) {
      throw ApiError.notFound('Patient profile not found. Please complete registration.');
    }

    return ApiResponse.success(res, patient, 'Patient profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Update my patient profile
 * PUT /patients/me
 */
const updateMyProfile = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, phone, address, medical_history, emergency_contact, dob } = req.body;

    const patient = await Patient.findOne({ where: { user_id: req.user.id }, transaction: t });
    if (!patient) throw ApiError.notFound('Patient profile not found');

    // Update User table fields
    if (name || phone) {
      await User.update(
        { ...(name && { name }), ...(phone && { phone }) },
        { where: { id: req.user.id }, transaction: t }
      );
    }

    // Update Patient table fields
    await patient.update({
      ...(address !== undefined && { address }),
      ...(medical_history !== undefined && { medical_history }),
      ...(emergency_contact !== undefined && { emergency_contact }),
      ...(dob !== undefined && { dob }),
    }, { transaction: t });

    await t.commit();

    const updated = await Patient.findOne({
      where: { user_id: req.user.id },
      include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
    });

    return ApiResponse.success(res, updated, 'Profile updated successfully');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get my orders (patient)
 * GET /patients/me/orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) throw ApiError.notFound('Patient profile not found');

    const where = { patient_id: patient.id };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name', 'phone'] }] },
        { association: 'schedule' },
        { association: 'payment' },
        { association: 'service' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, {
      total: count, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my therapy records (patient)
 * GET /patients/me/records
 */
const getMyRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) throw ApiError.notFound('Patient profile not found');

    const { count, rows } = await TherapyRecord.findAndCountAll({
      where: { patient_id: patient.id },
      include: [
        { association: 'order', include: [{ association: 'schedule' }, { association: 'service' }] },
        { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name'] }] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, {
      total: count, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all patients (Admin only)
 * GET /patients
 */
const getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Patient.findAndCountAll({
      include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone', 'created_at'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, {
      total: count, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile, getMyOrders, getMyRecords, getAllPatients };
