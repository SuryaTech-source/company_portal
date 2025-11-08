const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FUEL_SCHEMA = {};

FUEL_SCHEMA.FUEL = {
  vehicle: { type: Schema.Types.ObjectId, ref: "Fleet", required: true },
  driver: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  contract: { type: Schema.Types.ObjectId, ref: "Contract", required: true },

  monthlyAllowance: { type: Number, default: 0 },
  actualUsage: { type: Number, default: 0 },
  lastRechargeDate: { type: Date, default: null },
  remarks: { type: String, default: "" },
  startOdometer: { type: Number, required: true, min: 0 },
  endOdometer: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, required: true, min: 0 },
  issuedBy: { type: String, required: true },
  fuelConsumed: { type: Number, required: true, min: 0 }
};

module.exports = FUEL_SCHEMA;
