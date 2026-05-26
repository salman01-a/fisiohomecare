const { Payment, Order, Patient, Therapist, User } = require('../models');
const { getBucket } = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const FirestoreService = require('../services/firestoreService');

const streamPaymentProof = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ where: { order_id: req.params.order_id } });
    if (!payment || !payment.proof_url) {
      throw ApiError.notFound('Payment proof not found');
    }

    let fileUrl = payment.proof_url; 
    
    // Jika URL adalah URL lokal (dimulai dengan /uploads), kita bisa baca file lokal
    if (fileUrl.startsWith('/uploads/')) {
      const path = require('path');
      const fs = require('fs');
      // uploads folder ada di root backend/uploads
      const localPath = path.join(__dirname, '../../', fileUrl);
      if (!fs.existsSync(localPath)) {
        throw ApiError.notFound('Local image file not found');
      }
      return res.sendFile(localPath);
    }
    
    const bucket = getBucket();
    if (!bucket) {
      throw ApiError.internal('Firebase Storage is not configured');
    }

    // Jika URL adalah URL publik dari Firebase Storage, ekstrak path-nya
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(fileUrl);
        const bucketName = process.env.GCS_BUCKET_NAME || 'homecare-2b018.appspot.com';
        const prefix = `/${bucketName}/`;
        if (urlObj.pathname.startsWith(prefix)) {
          fileUrl = decodeURIComponent(urlObj.pathname.substring(prefix.length));
        } else {
          // Fallback parsing (e.g., if domain is firebasestorage.googleapis.com)
          const parts = urlObj.pathname.split('/o/');
          if (parts.length > 1) {
            fileUrl = decodeURIComponent(parts[1].split('?')[0]);
          } else {
            // Assume the format is /bucket-name/folder/file.ext
            fileUrl = decodeURIComponent(urlObj.pathname.split('/').slice(2).join('/'));
          }
        }
      } catch (e) {
        console.warn('Failed to parse URL for streaming:', fileUrl);
      }
    }

    const file = bucket.file(fileUrl);

    // Cek apakah file benar-benar ada di bucket
    const [exists] = await file.exists();
    if (!exists) {
      throw ApiError.notFound('Image file not found in storage bucket');
    }

    // Ambil metadata untuk mengetahui tipe file (jpeg/png) agar browser membacanya sebagai gambar
    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');

    // Lakukan streaming file langsung ke frontend
    file.createReadStream()
      .on('error', (err) => {
        next(ApiError.internal('Error streaming image file'));
      })
      .pipe(res);

  } catch (error) { 
    next(error); 
  }
};

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

    // Cash payments are automatically confirmed (no admin approval needed)
    const paymentStatus = method === 'cash' ? 'confirmed' : 'pending';

    const existing = await Payment.findOne({ where: { order_id } });
    let payment;
    
    if (existing) {
      if (existing.status === 'rejected') {
        // Allow re-upload if previous payment was rejected
        payment = await existing.update({
          amount, method, proof_url, status: paymentStatus, paid_at: new Date()
        });
      } else {
        throw ApiError.conflict('Payment already exists and is not rejected');
      }
    } else {
      payment = await Payment.create({
        order_id, amount, method, proof_url, status: paymentStatus, paid_at: new Date(),
      });
    }

    // If cash payment, auto-confirm the order as well
    if (method === 'cash') {
      await Order.update({ status: 'confirmed' }, { where: { id: order_id } });
    }

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'initiate_payment', `Pembayaran untuk pesanan #${order_id} (${method})`, { order_id, amount, method });
    } catch (_) {}

    return ApiResponse.created(res, payment, method === 'cash' ? 'Cash payment confirmed automatically' : 'Payment initiated successfully');
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

    // Log activity
    try {
      await FirestoreService.logActivity(req.user.id, req.user.name, 'confirm_payment', `Pembayaran pesanan #${req.params.order_id} ${status === 'confirmed' ? 'disetujui' : 'ditolak'}`, { order_id: req.params.order_id, status });
    } catch (_) {}

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

module.exports = { getAllPayments, initiatePayment, confirmPayment, getPaymentByOrderId, streamPaymentProof };
