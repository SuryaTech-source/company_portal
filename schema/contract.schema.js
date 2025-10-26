var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CONTRACT_SCHEMA = {};

CONTRACT_SCHEMA.CONTRACT = {
  clientName: { type: String, required: true },
  contractId: { type: String, unique: true },
  startDate: { type: Date },
  endDate: { type: Date },

  busesDeployed: [{ type: Schema.Types.ObjectId, ref: "Fleet" }],
  driversDeployed: [{ type: Schema.Types.ObjectId, ref: "Employee" }],

  contactOfficer: { type: String },
  contractType: { type: String, enum: ["Fixed", "Flexible"] },

  invoicingDate: { type: Date },
  lastPayment: { type: Date },

  status: { type: Number, enum: [1, 2, 0], default: 1 }, // 1=Active, 2=Inactive, 0=Deleted

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

module.exports = CONTRACT_SCHEMA;
