var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var VENDOR_SCHEMA = {};

VENDOR_SCHEMA.VENDOR = {
  vendorName: { type: String, required: true },
  contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
  startDate: Date,
  endDate: Date,
  buses: [{ type: Schema.Types.ObjectId, ref: "Fleet" }],
  drivers: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
  noOfDrivers: Number,
  noOfBuses: Number,
  contactOfficer: String,
  contractType: String,
  invoicingDate: Date,
  lastPayment: Date,
  status: { type: Number, default: 1 },
  documents: [
    {
      documentType: String,
      fileUrl: String,
    },
  ],
};

module.exports = VENDOR_SCHEMA;
