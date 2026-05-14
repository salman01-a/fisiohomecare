const { Order, Payment, Therapist, sequelize } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const { Op } = require('sequelize');

const getStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.count();
    const activeTherapists = await Therapist.count({ where: { status: 'active' } });
    const pendingTherapists = await Therapist.count({ where: { status: 'pending' } });
    const revenue = await Payment.sum('amount', { where: { status: 'confirmed' } });

    const ordersByStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
    });

    return ApiResponse.success(res, {
      totalOrders,
      activeTherapists,
      pendingTherapists,
      totalRevenue: revenue || 0,
      ordersByStatus,
    });
  } catch (error) { next(error); }
};

const getDashboardOrders = async (req, res, next) => {
  try {
    const { status, date, therapist_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (therapist_id) where.therapist_id = therapist_id;
    if (date) {
      where.created_at = {
        [Op.gte]: new Date(`${date}T00:00:00`),
        [Op.lt]: new Date(`${date}T23:59:59`),
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { association: 'patient', include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }] },
        { association: 'therapist', include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone'] }] },
        { association: 'schedule' },
        { association: 'payment' },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, {
      total: count, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) { next(error); }
};

module.exports = { getStats, getDashboardOrders };
