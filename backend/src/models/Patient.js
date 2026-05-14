const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
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
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: { msg: 'Invalid date format' },
        isBefore: {
          args: new Date().toISOString().split('T')[0],
          msg: 'Date of birth must be in the past',
        },
      },
    },
  }, {
    tableName: 'patients',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id'] },
    ],
  });

  return Patient;
};
