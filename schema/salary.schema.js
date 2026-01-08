var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SALARY_SCHEMA = {};

SALARY_SCHEMA.SALARY = {
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  month: { type: Number, required: true }, // 1–12
  year: { type: Number, required: true },

  baseSalary: { type: Number, required: true },
  daysPresent: { type: Number, default: 0 },
  totalWorkingDays: { type: Number, default: 30 },

  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  overtimeAmount: { type: Number, default: 0 },

  penalties: [
    {
      type: { type: String, enum: ["Traffic Violation", "Damage", "Other"], required: true },
      description: String,
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      isReverted: { type: Boolean, default: false },
      revertReason: String,
    },
  ],

  // Manual deductions this month
  penaltyDeduction: { type: Number, default: 0 },
  allowanceDeduction: { type: Number, default: 0 },

  totalPenaltyAmount: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  finalSalary: { type: Number, default: 0 },

  paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  paymentDate: Date,
  remarks: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

module.exports = SALARY_SCHEMA;
