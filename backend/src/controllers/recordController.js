const { TherapyRecord, Order, Therapist, Patient } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const createRecord = async (req, res, next) => {
  try {
    const { order_id, chief_complaint, diagnosis, actions_taken, session_number, check_in_at, check_out_at } = req.body;

    const therapist = await Therapist.findOne({ where: { user_id: req.user.id } });
    if (!therapist) throw ApiError.forbidden('Only therapists can create records');

    const order = await Order.findByPk(order_id);
    if (!order) throw ApiError.notFound('Order not found');
    if (order.therapist_id !== therapist.id) throw ApiError.forbidden('Not your order');

    const existing = await TherapyRecord.findOne({ where: { order_id } });
    if (existing) throw ApiError.conflict('Record already exists for this order');

    const record = await TherapyRecord.create({
      order_id, therapist_id: therapist.id, patient_id: order.patient_id,
      chief_complaint, diagnosis, actions_taken, session_number: session_number || 1,
      check_in_at, check_out_at,
    });

    return ApiResponse.created(res, record, 'Therapy record created');
  } catch (error) { next(error); }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await TherapyRecord.findByPk(req.params.id, {
      include: [
        { association: 'order', include: [{ association: 'schedule' }] },
        { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name', 'email'] }] },
        { association: 'patient', include: [{ association: 'user', attributes: ['id', 'name', 'email'] }] },
      ],
    });
    if (!record) throw ApiError.notFound('Record not found');
    return ApiResponse.success(res, record);
  } catch (error) { next(error); }
};

const getPatientRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const patient = await Patient.findByPk(req.params.id);
    if (!patient) throw ApiError.notFound('Patient not found');

    if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
      throw ApiError.forbidden('You can only view your own records');
    }

    const { count, rows } = await TherapyRecord.findAndCountAll({
      where: { patient_id: req.params.id },
      include: [
        { association: 'order', include: [{ association: 'schedule' }] },
        { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name'] }] },
      ],
      limit: parseInt(limit), offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, {
      total: count, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) { next(error); }
};

module.exports = { createRecord, getRecordById, getPatientRecords };
