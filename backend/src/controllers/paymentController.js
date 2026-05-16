const { Payment, Order, Patient, Therapist, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const initiatePayment = async (req, res, next) => {
  try {
    const { order_id, amount, method, proof_url } = req.body;

    const order = await Order.findByPk(order_id);
    if (!order) throw ApiError.notFound('Order not found');

    // Security: only the patient who owns this order can initiate payment
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient || order.patient_id !== patient.id) {
        throw ApiError.forbidden('You can only pay for your own orders');
      }
    }

    // Prevent payment for completed or cancelled orders
    if (['done', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot pay for an order with status '${order.status}'`);
    }

    const existing = await Payment.findOne({ where: { order_id } });
    if (existing) throw ApiError.conflict('Payment already exists for this order');

    const payment = await Payment.create({
      order_id, amount, method, proof_url, status: 'pending', paid_at: new Date(),
    });

    return ApiResponse.created(res, payment, 'Payment initiated successfully');
  } catch (error) { next(error); }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected'].includes(status)) {
      throw ApiError.badRequest('Status must be "confirmed" or "rejected"');
    }

    const payment = await Payment.findOne({ where: { order_id: req.params.order_id } });
    if (!payment) throw ApiError.notFound('Payment not found');

    await payment.update({ status, confirmed_by: req.user.id });

    if (status === 'confirmed') {
      await Order.update({ status: 'confirmed' }, { where: { id: payment.order_id } });
    }

    return ApiResponse.success(res, payment, `Payment ${status}`);
  } catch (error) { next(error); }
};

const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { order_id: req.params.order_id },
      include: [{ association: 'order' }, { association: 'confirmer', attributes: ['id', 'name'] }],
    });
    if (!payment) throw ApiError.notFound('Payment not found');
    return ApiResponse.success(res, payment);
  } catch (error) { next(error); }
};

const getAllPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const payments = await Payment.findAll({
      where,
      include: [
        {
          association: 'order',
          include: [
            { association: 'patient', include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }] },
            { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }] },
            { association: 'schedule' },
          ],
        },
        { association: 'confirmer', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.success(res, payments, 'Payments retrieved successfully');
  } catch (error) { next(error); }
};

module.exports = { getAllPayments, initiatePayment, confirmPayment, getPaymentByOrderId };
