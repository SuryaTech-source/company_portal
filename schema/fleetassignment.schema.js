var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FLEET_ASSIGNMENT_SCHEMA = {};

FLEET_ASSIGNMENT_SCHEMA.FLEET_ASSIGNMENT = {
  fleetId: { type: Schema.Types.ObjectId, ref: "Fleet", required: true },
  driverId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },

  dateAssigned: { type: Date, default: Date.now },
  dateUnassigned: { type: Date }, // when driver was unassigned
  odometerReadingStart: { type: Number, default: 0 },
  odometerReadingEnd: { type: Number, default: 0 },

  contractId: { type: String },
  remarks: { type: String },

  status: {
    type: Number,
    enum: [1, 2, 0], // 1 = Active, 2 = Unassigned/Completed, 0 = Deleted
    default: 1
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

module.exports = FLEET_ASSIGNMENT_SCHEMA;
