const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db/postgres");

const userModel = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    college_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    roll_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM(
        "admin",
        "coordinator",
        "participant",
        "registration_desk"
      ),
      allowNull: false,
      defaultValue: "participant",
    },

    user_type: {
      type: DataTypes.ENUM("PARTICIPANT", "ALUMNI", "STAFF"),
      allowNull: false,
      defaultValue: "PARTICIPANT",
    },

    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    login_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },

    student_id_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    year_of_study: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    batch_year: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    place: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    current_organization: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    accommodation_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = userModel;
