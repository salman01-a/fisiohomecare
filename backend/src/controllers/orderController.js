const { Order, Patient, Therapist, Schedule, User, Payment, TherapyRecord, Service, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');
const FirestoreService = require('../services/firestoreService');

/**
 * List all orders (with filters)
 * GET /orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, therapist_id, patient_id, date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Role-based filtering: patients only see their own orders
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient) throw ApiError.notFound('Patient profile not found');
      where.patient_id = patient.id;
    }

    // Role-based filtering: therapists only see their own orders
    if (req.user.role === 'therapist') {
      const therapist = await Therapist.findOne({ where: { user_id: req.user.id } });
      if (!therapist) throw ApiError.notFound('Therapist profile not found');
      where.therapist_id = therapist.id;
    }

    if (status) where.status = status;
    if (therapist_id && req.user.role === 'admin') where.therapist_id = therapist_id;
    if (patient_id && req.user.role === 'admin') where.patient_id = patient_id;
    if (date) {
      where.created_at = {
        [Op.gte]: new Date(`${date}T00:00:00`),
        [Op.lt]: new Date(`${date}T23:59:59`),
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        {
          association: 'therapist',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        { association: 'schedule' },
        { association: 'payment' },
        { association: 'service' },
        { association: 'therapyRecord' },
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
      'Orders retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new order (Patient)
 * POST /orders
 */
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { therapist_id, schedule_id, service_id, service_type, address, lat, lng, notes } = req.body;

    // Get patient profile
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      throw ApiError.notFound('Patient profile not found. Please complete your profile first.');
    }

    // Validate therapist
    const therapist = await Therapist.findByPk(therapist_id);
    if (!therapist) {
      throw ApiError.notFound('Therapist not found');
    }
    if (therapist.status !== 'active') {
      throw ApiError.badRequest('This therapist is not currently active');
    }

    // Validate and reserve schedule
    const schedule = await Schedule.findOne({
      where: { id: schedule_id, therapist_id, is_booked: false },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!schedule) {
      throw ApiError.badRequest('Schedule slot is not available or already booked');
    }

    // Mark schedule as booked
    await schedule.update({ is_booked: true }, { transaction: t });

    // Create order
    const order = await Order.create({
      patient_id: patient.id,
      therapist_id,
      schedule_id,
      service_id,
      service_type,
      address: address || patient.address,
      lat,
      lng,
      notes,
      status: 'pending',
    }, { transaction: t });

    await t.commit();

    // Re-fetch with associations
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        {
          association: 'therapist',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        { association: 'schedule' },
        { association: 'service' },
      ],
    });

    // Send notification to therapist
    try {
      const therapistData = await Therapist.findByPk(therapist_id);
      if (therapistData) {
        await FirestoreService.sendUserNotification(
          therapistData.user_id,
          '🆕 Pesanan Baru',
          `Ada pesanan baru pada tanggal ${schedule.date}. Silakan cek jadwal Anda.`,
          'info'
        );
      }
    } catch (notifErr) {
      console.warn('[Firestore] Failed to send new order notification:', notifErr.message);
    }

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'create_order', `Pesanan baru #${order.id} dibuat`, { order_id: order.id, therapist_id, service_type });
    } catch (_) {}

    return ApiResponse.created(res, fullOrder, 'Order created successfully');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get order detail
 * GET /orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        {
          association: 'therapist',
          include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
        },
        { association: 'schedule' },
        { association: 'payment' },
        { association: 'therapyRecord' },
        { association: 'service' },
      ],
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Authorization check: only related users or admin
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient || order.patient_id !== patient.id) {
        throw ApiError.forbidden('You can only view your own orders');
      }
    }
    if (req.user.role === 'therapist') {
      const therapist = await Therapist.findOne({ where: { user_id: req.user.id } });
      if (!therapist || order.therapist_id !== therapist.id) {
        throw ApiError.forbidden('You can only view your assigned orders');
      }
    }

    return ApiResponse.success(res, order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PATCH /orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'otw', 'ongoing', 'done', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{ association: 'patient' }],
    });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Status transition validation
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['otw', 'cancelled'],
      otw: ['ongoing', 'cancelled'],
      ongoing: ['done'],
      done: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from '${order.status}' to '${status}'. Valid transitions: ${validTransitions[order.status].join(', ') || 'none'}`
      );
    }

    await order.update({ status });

    // If cancelled, free up the schedule slot and reject associated payments
    if (status === 'cancelled') {
      await Schedule.update(
        { is_booked: false },
        { where: { id: order.schedule_id } }
      );
      await Payment.update(
        { status: 'rejected' },
        { where: { order_id: order.id, status: ['pending', 'confirmed'] } }
      );
    }

    // === NoSQL: Auto-sync visit tracking & notification to Firestore ===
    try {
      const FirestoreService = require('../services/firestoreService');

      // Map order status to tracking status
      const trackingStatusMap = {
        confirmed: { status: 'confirmed', notes: 'Pesanan dikonfirmasi oleh admin.' },
        otw:       { status: 'otw',       notes: 'Terapis sedang dalam perjalanan menuju lokasi Anda.' },
        ongoing:   { status: 'ongoing',   notes: 'Sesi terapi sedang berlangsung.' },
        done:      { status: 'done',      notes: 'Sesi terapi telah selesai.' },
        cancelled: { status: 'cancelled', notes: 'Pesanan dibatalkan.' },
      };

      const notificationMap = {
        confirmed: { title: '✅ Pesanan Dikonfirmasi',    message: 'Pesanan Anda telah dikonfirmasi. Terapis akan segera menghubungi Anda.' },
        otw:       { title: '🚗 Terapis Dalam Perjalanan', message: 'Terapis sedang dalam perjalanan menuju lokasi Anda. Harap bersiap.' },
        ongoing:   { title: '▶️ Sesi Terapi Dimulai',     message: 'Sesi fisioterapi Anda sedang berlangsung.' },
        done:      { title: '🎉 Sesi Terapi Selesai',     message: 'Sesi fisioterapi Anda telah selesai. Jangan lupa beri rating!' },
        cancelled: { title: '❌ Pesanan Dibatalkan',       message: 'Pesanan Anda telah dibatalkan.' },
      };

      if (trackingStatusMap[status]) {
        const { status: tStatus, notes: tNotes } = trackingStatusMap[status];
        await FirestoreService.logVisitTracking(order.id, tStatus, {}, tNotes);
      }

      if (notificationMap[status] && order.patient_id) {
        const { title, message } = notificationMap[status];
        const type = status === 'cancelled' ? 'error' : status === 'done' ? 'success' : 'info';
        await FirestoreService.sendPatientNotification(order.patient_id, title, message, type);
      }

      // Notify therapist (user-based notifications)
      const therapistNotifMap = {
        confirmed: { title: '✅ Pesanan Dikonfirmasi', message: 'Pesanan telah dikonfirmasi oleh admin. Harap siapkan jadwal kunjungan.' },
        cancelled: { title: '❌ Pesanan Dibatalkan', message: 'Pesanan telah dibatalkan.' },
      };
      if (therapistNotifMap[status]) {
        const therapistData = await Therapist.findByPk(order.therapist_id);
        if (therapistData) {
          const { title, message } = therapistNotifMap[status];
          await FirestoreService.sendUserNotification(therapistData.user_id, title, message, status === 'cancelled' ? 'error' : 'info');
        }
      }
    } catch (firestoreErr) {
      // Firestore errors should not block the main response
      console.warn('[Firestore] Failed to sync tracking/notification:', firestoreErr.message);
    }
    // =================================================================

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'update_order_status', `Status pesanan #${order.id} diubah ke '${status}'`, { order_id: order.id, status });
    } catch (_) {}

    return ApiResponse.success(res, order, `Order status updated to '${status}'`);
  } catch (error) {
    next(error);
  }
};


/**
 * Cancel order
 * DELETE /orders/:id
 */
const cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (['done', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest('Cannot cancel an order that is already done or cancelled');
    }

    // Free up schedule
    await Schedule.update(
      { is_booked: false },
      { where: { id: order.schedule_id }, transaction: t }
    );

    await order.update({ status: 'cancelled' }, { transaction: t });

    // Cancel associated payment if exists
    await Payment.update(
      { status: 'rejected' },
      { where: { order_id: order.id, status: ['pending', 'confirmed'] }, transaction: t }
    );

    await t.commit();

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'cancel_order', `Pesanan #${order.id} dibatalkan`, { order_id: order.id });
    } catch (_) {}

    return ApiResponse.success(res, order, 'Order cancelled successfully');
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Rate an order (Patient only, after done)
 * POST /orders/:id/rate
 */
const rateOrder = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw ApiError.badRequest('Rating must be between 1 and 5');
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Must be patient's own order
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient || order.patient_id !== patient.id) {
      throw ApiError.forbidden('You can only rate your own orders');
    }

    if (order.status !== 'done') {
      throw ApiError.badRequest('Can only rate completed orders');
    }

    if (order.rating !== null) {
      throw ApiError.badRequest('Order has already been rated');
    }

    // Save rating to order
    await order.update({
      rating: parseInt(rating),
      rating_comment: comment || null,
    });

    // Recalculate therapist average rating
    const avgResult = await Order.findOne({
      where: {
        therapist_id: order.therapist_id,
        rating: { [Op.not]: null },
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
      ],
      raw: true,
    });

    const avgRating = parseFloat(avgResult.avg_rating) || 0;
    await Therapist.update(
      { rating: Math.round(avgRating * 100) / 100 },
      { where: { id: order.therapist_id } }
    );

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'rate_order', `Rating ${rating}⭐ untuk pesanan #${order.id}`, { order_id: order.id, rating });
    } catch (_) {}

    return ApiResponse.success(res, {
      rating: order.rating,
      rating_comment: order.rating_comment,
      therapist_avg_rating: avgRating,
    }, 'Rating submitted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
};
