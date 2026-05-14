const router = require('express').Router();

const authRoutes = require('./authRoutes');
const therapistRoutes = require('./therapistRoutes');
const orderRoutes = require('./orderRoutes');
const recordRoutes = require('./recordRoutes');
const patientRoutes = require('./patientRoutes');
const paymentRoutes = require('./paymentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const uploadRoutes = require('./uploadRoutes');
const serviceRoutes = require('./serviceRoutes');

router.use('/auth', authRoutes);
router.use('/therapists', therapistRoutes);
router.use('/orders', orderRoutes);
router.use('/records', recordRoutes);
router.use('/patients', patientRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);
router.use('/services', serviceRoutes);

module.exports = router;
