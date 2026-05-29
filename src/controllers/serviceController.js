const { Service } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Get all services
 * GET /services
 */
const getAllServices = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const services = await Service.findAll({ where, order: [['name', 'ASC']] });
    return ApiResponse.success(res, services, 'Services retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID
 * GET /services/:id
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) throw ApiError.notFound('Service not found');
    return ApiResponse.success(res, service);
  } catch (error) {
    next(error);
  }
};

/**
 * Create service (Admin)
 * POST /services
 */
const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration_minutes } = req.body;
    const service = await Service.create({ name, description, price, duration_minutes });
    return ApiResponse.created(res, service, 'Service created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update service (Admin)
 * PUT /services/:id
 */
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) throw ApiError.notFound('Service not found');

    const { name, description, price, duration_minutes, is_active } = req.body;
    await service.update({ name, description, price, duration_minutes, is_active });
    return ApiResponse.success(res, service, 'Service updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service (Admin)
 * DELETE /services/:id
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) throw ApiError.notFound('Service not found');

    await service.destroy();
    return ApiResponse.success(res, null, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
