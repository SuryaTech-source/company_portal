var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FLEET_ASSIGNMENT_SCHEMA = {};

FLEET_ASSIGNMENT_SCHEMA.FLEET_ASSIGNMENT = {
  fleetId: { type: Schema.Types.ObjectId, ref: "Fleet", required: true },
  driverId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  contractId: { type: Schema.Types.ObjectId, ref: "Contract" }, // ✅ updated to ObjectId reference

  dateAssigned: { type: Date, default: Date.now },
  dateUnassigned: { type: Date },

  odometerReadingStart: { type: Number, default: 0 },
  odometerReadingEnd: { type: Number, default: 0 },

  remarks: { type: String },
  status: { type: Number, enum: [1, 2, 0], default: 1 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

module.exports = FLEET_ASSIGNMENT_SCHEMA;
