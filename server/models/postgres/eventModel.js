const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db/postgres");

const eventModel = sequelize.define(
  "events",
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

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    coordinator_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    coordinator_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    venue: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    is_online: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    category: {
      type: DataTypes.ENUM("TECHNICAL", "NON_TECHNICAL", "FLAGSHIP"),
      allowNull: false,
      defaultValue: "TECHNICAL",
    },

    team_type: {
      type: DataTypes.ENUM("INDIVIDUAL", "TEAM"),
      allowNull: false,
      defaultValue: "INDIVIDUAL",
    },

    min_team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    max_team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 18,
    },

    registration_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    is_flagship: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    guardian_asset: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    entry_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    rules_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    is_results_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    status: {
      type: DataTypes.ENUM("draft", "open", "closed", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
  },
  {
    tableName: "events",
    timestamps: true,
  }
);

module.exports = eventModel;
