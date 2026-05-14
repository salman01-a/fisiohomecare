const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Therapist = sequelize.define('Therapist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'License number is required' },
      },
    },
    license_doc_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended'),
      defaultValue: 'pending',
      allowNull: false,
    },
    validated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    validated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5,
      },
    },
  }, {
    tableName: 'therapists',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['specialization'] },
    ],
  });

  return Therapist;
};
