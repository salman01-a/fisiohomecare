const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TherapyRecord = sequelize.define('TherapyRecord', {
    id: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
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
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    chief_complaint: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actions_taken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    session_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    check_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    photo_urls: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('photo_urls');
        return raw ? JSON.parse(raw) : [];
      },
      set(val) {
        this.setDataValue('photo_urls', val ? JSON.stringify(val) : null);
      },
    },
  }, {
    tableName: 'therapy_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['order_id', 'session_number'] },
      { fields: ['therapist_id'] },
      { fields: ['patient_id'] },
    ],
  });

  return TherapyRecord;
};
