const { TherapyRecord, Order, Therapist, Patient } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const FirestoreService = require('../services/firestoreService');

const createRecord = async (req, res, next) => {
  try {
    const { 
      order_id, chief_complaint, diagnosis, actions_taken, session_number, check_in_at, check_out_at,
      // NoSQL Fields:
      flexible_notes, progress_rating, attachments 
    } = req.body;

    const therapist = await Therapist.findOne({ where: { user_id: req.user.id } });
    if (!therapist) throw ApiError.forbidden('Only therapists can create records');

    const order = await Order.findByPk(order_id);
    if (!order) throw ApiError.notFound('Order not found');
    if (order.therapist_id !== therapist.id) throw ApiError.forbidden('Not your order');

    const existing = await TherapyRecord.findOne({ where: { order_id } });
    if (existing) throw ApiError.conflict('Record already exists for this order');

    // 1. Simpan Rekam Terapi Utama ke SQL
    const record = await TherapyRecord.create({
      order_id, therapist_id: therapist.id, patient_id: order.patient_id,
      chief_complaint, diagnosis, actions_taken, session_number: session_number || 1,
      check_in_at, check_out_at,
    });

    // 2. Simpan Catatan Fleksibel, Progress, Foto ke NoSQL (Firestore)
    if (flexible_notes || progress_rating || attachments) {
      await FirestoreService.saveTherapyNote(record.id, {
        order_id,
        patient_id: order.patient_id,
        therapist_id: therapist.id,
        flexible_notes: flexible_notes || '',
        progress_rating: progress_rating || 0,
        attachments: attachments || [],
      });
    }

    // 3. Kirim Notifikasi ke NoSQL (Firestore)
    await FirestoreService.sendPatientNotification(
      order.patient_id,
      'Rekam Terapi Selesai',
      `Sesi terapi ${session_number || 1} telah selesai. Rekam medis telah diupdate.`,
      'success'
    );

    return ApiResponse.created(res, record, 'Therapy record created (SQL & NoSQL synced)');
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

    // Ambil detail NoSQL (catatan fleksibel)
    const nosqlData = await FirestoreService.getTherapyNote(record.id);

    // Gabungkan data SQL dan NoSQL
    const responseData = {
      ...record.toJSON(),
      nosql_details: nosqlData || null,
    };

    return ApiResponse.success(res, responseData);
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
