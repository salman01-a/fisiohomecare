const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
  }
);

// Import models
const User = require('./User')(sequelize);
const Therapist = require('./Therapist')(sequelize);
const Patient = require('./Patient')(sequelize);
const Schedule = require('./Schedule')(sequelize);
const Order = require('./Order')(sequelize);
const Payment = require('./Payment')(sequelize);
const TherapyRecord = require('./TherapyRecord')(sequelize);
const Service = require('./Service')(sequelize);

// ============ Associations ============

// User <-> Therapist (1:1)
User.hasOne(Therapist, { foreignKey: 'user_id', as: 'therapistProfile' });
Therapist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Patient (1:1)
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Therapist validated_by -> User (admin)
Therapist.belongsTo(User, { foreignKey: 'validated_by', as: 'validator' });

// Therapist <-> Schedule (1:M)
Therapist.hasMany(Schedule, { foreignKey: 'therapist_id', as: 'schedules' });
Schedule.belongsTo(Therapist, { foreignKey: 'therapist_id', as: 'therapist' });

// Order relationships
Patient.hasMany(Order, { foreignKey: 'patient_id', as: 'orders' });
Order.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

Therapist.hasMany(Order, { foreignKey: 'therapist_id', as: 'orders' });
Order.belongsTo(Therapist, { foreignKey: 'therapist_id', as: 'therapist' });

Schedule.hasOne(Order, { foreignKey: 'schedule_id', as: 'order' });
Order.belongsTo(Schedule, { foreignKey: 'schedule_id', as: 'schedule' });

// Service <-> Order (1:M)
Service.hasMany(Order, { foreignKey: 'service_id', as: 'orders' });
Order.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Order <-> Payment (1:1)
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Payment confirmed_by -> User (admin)
Payment.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmer' });

// Order <-> TherapyRecord (1:1)
Order.hasOne(TherapyRecord, { foreignKey: 'order_id', as: 'therapyRecord' });
TherapyRecord.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Therapist <-> TherapyRecord (1:M)
Therapist.hasMany(TherapyRecord, { foreignKey: 'therapist_id', as: 'therapyRecords' });
TherapyRecord.belongsTo(Therapist, { foreignKey: 'therapist_id', as: 'therapist' });

// Patient <-> TherapyRecord (1:M)
Patient.hasMany(TherapyRecord, { foreignKey: 'patient_id', as: 'therapyRecords' });
TherapyRecord.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

const db = {
  sequelize,
  Sequelize,
  User,
  Therapist,
  Patient,
  Schedule,
  Order,
  Payment,
  TherapyRecord,
  Service,
};

module.exports = db;
