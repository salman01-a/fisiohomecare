const { Therapist, User, Schedule, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');

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

    const where = { therapist_id: req.params.id };
    if (date) where.date = date;
    if (is_booked !== undefined) where.is_booked = is_booked === 'true';

    let schedules = await Schedule.findAll({
      where,
      order: [['date', 'ASC'], ['start_time', 'ASC']],
    });

    const now = new Date();
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

module.exports = {
  getAllTherapists,
  getTherapistById,
  validateTherapist,
  getTherapistSchedules,
  createSchedule,
  deleteSchedule,
};
