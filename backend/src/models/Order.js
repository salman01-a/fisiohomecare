const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    therapist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'therapists',
        key: 'id',
      },
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schedules',
        key: 'id',
      },
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'services',
        key: 'id',
      },
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Address is required' },
      },
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'otw', 'ongoing', 'done', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      // URL foto kondisi pasien yang di-upload sebelum terapis datang
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    rating_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['therapist_id'] },
      { fields: ['schedule_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
    ],
  });

  return Order;
};
