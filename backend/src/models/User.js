const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: 'Email already registered',
      },
      validate: {
        isEmail: { msg: 'Invalid email format' },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[+]?[\d\s-()]{8,20}$/,
          msg: 'Invalid phone number format',
        },
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'therapist', 'patient'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['admin', 'therapist', 'patient']],
          msg: 'Role must be admin, therapist, or patient',
        },
      },
    },
    firebase_uid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      // Used for development fallback when Firebase is not configured
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['firebase_uid'] },
      { fields: ['role'] },
    ],
  });

  // Instance method to return safe user data (no password)
  User.prototype.toSafeJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return User;
};
