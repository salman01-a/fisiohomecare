const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Amount must be positive' },
      },
    },
    method: {
      type: DataTypes.ENUM('transfer', 'cash'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    proof_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    confirmed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['order_id'] },
      { fields: ['status'] },
    ],
  });

  return Payment;
};
