var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var VENDOR_SCHEMA = {};

VENDOR_SCHEMA.VENDOR = {
  vendorName: { type: String, required: true },
  contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },

  startDate: Date,
  endDate: Date,

  // ✅ Assigned fleets & drivers (Manual Entry)
  drivers: [
    {
      busRegisterNumber: { type: String },
      driverName: { type: String },
      driverContact: { type: String },
      driverCivilId: { type: String },
      driverDocUrl: { type: String }, // File URL
    }
  ],

  // ✅ Counts (old fields restored)
  noOfDrivers: { type: Number, default: 0 },
  noOfBuses: { type: Number, default: 0 },

  // ✅ Officer / Contract Details
  contactOfficer: { type: String },
  contractType: { type: String }, // free text

  // ✅ Invoicing & payments
  invoicingDate: { type: Date },
  lastPayment: { type: Date },

  // ✅ Status
  status: { type: Number, default: 1 },  // 1 active, 2 inactive, etc.



  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

module.exports = VENDOR_SCHEMA;
