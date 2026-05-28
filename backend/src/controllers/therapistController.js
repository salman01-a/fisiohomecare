const { Therapist, User, Schedule, Order, Patient, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');
const FirestoreService = require('../services/firestoreService');

/**
 * List all therapists (Admin)
 * GET /therapists
 */
const getAllTherapists = async (req, res, next) => {
  try {
    const { status, specialization, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };

    const { count, rows } = await Therapist.findAndCountAll({
      where,
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'created_at'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(
      res,
      rows,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
      'Therapists retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get therapist detail
 * GET /therapists/:id
 */
const getTherapistById = async (req, res, next) => {
  try {
    const therapist = await Therapist.findByPk(req.params.id, {
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'created_at'],
        },
        {
          association: 'validator',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }

    return ApiResponse.success(res, therapist, 'Therapist retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Validate/Update therapist status (Admin)
 * PATCH /therapists/:id/validate
 */
const validateTherapist = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      throw ApiError.badRequest('Status must be "active" or "suspended"');
    }

    const therapist = await Therapist.findByPk(req.params.id);
    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }

    await therapist.update({
      status,
      validated_by: req.user.id,
      validated_at: new Date(),
    });

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'validate_therapist', `Terapis #${req.params.id} ${status === 'active' ? 'divalidasi' : 'di-suspend'}`, { therapist_id: req.params.id, status });
    } catch (_) {}

    return ApiResponse.success(res, therapist, `Therapist ${status === 'active' ? 'approved' : 'suspended'} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get therapist schedules
 * GET /therapists/:id/schedules
 */
const getTherapistSchedules = async (req, res, next) => {
  try {
    const { date, is_booked } = req.query;

    const therapist = await Therapist.findByPk(req.params.id);
    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }

    // Auto-cleanup: delete unbooked past schedules
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
    await Schedule.destroy({
      where: {
        therapist_id: req.params.id,
        is_booked: false,
        [Op.or]: [
          { date: { [Op.lt]: todayStr } },
          { date: todayStr, end_time: { [Op.lte]: currentTimeStr } },
        ],
      },
    });

    const where = { therapist_id: req.params.id };
    if (date) where.date = date;
    if (is_booked !== undefined) where.is_booked = is_booked === 'true';

    let schedules = await Schedule.findAll({
      where,
      order: [['date', 'ASC'], ['start_time', 'ASC']],
    });

    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    schedules = schedules.filter(s => {
      // If it's booked, we should show it (since it's an order)
      if (s.is_booked) return true;

      // Filter out past and 'mepet' schedules
      const [year, month, day] = s.date.split('-');
      const [hours, minutes] = s.start_time.split(':');
      const scheduleTime = new Date(year, month - 1, day, hours, minutes);

      return scheduleTime > twoHoursFromNow;
    });

    return ApiResponse.success(res, schedules, 'Schedules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create schedule slot (Admin / Therapist)
 * POST /therapists/:id/schedules
 */
const createSchedule = async (req, res, next) => {
  try {
    const { date, start_time, end_time } = req.body;
    const therapistId = req.params.id;

    const therapist = await Therapist.findByPk(therapistId);
    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }

    if (therapist.status !== 'active') {
      throw ApiError.badRequest('Only active therapists can have schedules');
    }

    // Validate schedule is at least 2 hours in the future
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const [sHours, sMinutes] = start_time.split(':');
    const scheduleDateTime = new Date(`${date}T${String(sHours).padStart(2,'0')}:${String(sMinutes).padStart(2,'0')}:00`);
    if (scheduleDateTime <= twoHoursFromNow) {
      throw ApiError.badRequest('Jadwal harus minimal 2 jam dari sekarang');
    }

    // Check for overlapping schedules
    const overlap = await Schedule.findOne({
      where: {
        therapist_id: therapistId,
        date,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time },
          },
        ],
      },
    });

    if (overlap) {
      throw ApiError.conflict('Schedule overlaps with an existing slot');
    }

    const schedule = await Schedule.create({
      therapist_id: therapistId,
      date,
      start_time,
      end_time,
    });

    return ApiResponse.created(res, schedule, 'Schedule created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete schedule slot
 * DELETE /therapists/:id/schedules/:scheduleId
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({
      where: {
        id: req.params.scheduleId,
        therapist_id: req.params.id,
      },
    });

    if (!schedule) {
      throw ApiError.notFound('Schedule not found');
    }

    if (schedule.is_booked) {
      throw ApiError.badRequest('Cannot delete a booked schedule. Cancel the order first.');
    }

    await schedule.destroy();

    return ApiResponse.success(res, null, 'Schedule deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews/ratings for a therapist
 * GET /therapists/:id/reviews
 */
const getTherapistReviews = async (req, res, next) => {
  try {
    const therapist = await Therapist.findByPk(req.params.id);
    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where: {
        therapist_id: req.params.id,
        rating: { [Op.not]: null },
      },
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['id', 'name'] }],
        },
        { association: 'service' },
      ],
      attributes: ['id', 'rating', 'rating_comment', 'service_type', 'created_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    // Calculate summary
    const allRatings = await Order.findAll({
      where: { therapist_id: req.params.id, rating: { [Op.not]: null } },
      attributes: ['rating'],
      raw: true,
    });
    const totalReviews = allRatings.length;
    const avgRating = totalReviews > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 100) / 100
      : 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    return ApiResponse.paginated(
      res,
      rows,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        summary: { totalReviews, avgRating, distribution },
      },
      'Reviews retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTherapists,
  getTherapistById,
  validateTherapist,
  getTherapistSchedules,
  createSchedule,
  deleteSchedule,
  getTherapistReviews,
};
