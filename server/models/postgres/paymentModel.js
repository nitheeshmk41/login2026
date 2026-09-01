const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db/postgres");
const userModel = require("./userModel");

const paymentModel = sequelize.define(
  "payments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: userModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100.0,
    },

    transaction_reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM(
        "NOT_SUBMITTED",
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "required",
        "in_progress",
        "successful",
        "failed",
        "review",
        "refund_initiated",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    payment_date: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "UPI",
    },

    receipt_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: userModel,
        key: "id",
      },
      onDelete: "SET NULL",
    },

    refund_status: {
      type: DataTypes.ENUM("not_applicable", "pending", "initiated", "completed", "failed"),
      allowNull: false,
      defaultValue: "not_applicable",
    },

    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

module.exports = paymentModel;
