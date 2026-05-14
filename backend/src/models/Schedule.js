const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    therapist_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'therapists',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: 'Invalid date format' },
      },
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    is_booked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'schedules',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['therapist_id'] },
      { fields: ['date'] },
      { fields: ['is_booked'] },
      { fields: ['therapist_id', 'date'] },
    ],
    validate: {
      endTimeAfterStartTime() {
        if (this.start_time >= this.end_time) {
          throw new Error('End time must be after start time');
        }
      },
    },
  });

  return Schedule;
};
