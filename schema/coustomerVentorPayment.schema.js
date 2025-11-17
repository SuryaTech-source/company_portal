// models/payment.schema.js (or wherever)
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PAYMENT_SCHEMA = {};

/**
 * Customer Payments Schema
 */
PAYMENT_SCHEMA.CUSTOMER_PAYMENT = {
  clientName: { type: String, required: true },
  contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
  invoiceNo: { type: String },
  invoiceRef: { type: Schema.Types.ObjectId, ref: "Invoice" },
  dueDate: { type: Date },

  // 💥 NEW FIELDS
  isPartial: { type: Boolean, default: false },
  nextDueDate: { type: Date, default: null },

  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["Paid", "Unpaid", "Partial"], default: "Unpaid" },
  remarks: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};


/**
 * Vendor Payments Schema
 */
PAYMENT_SCHEMA.VENDOR_PAYMENT = {
  vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
  contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
  invoiceNo: { type: String },
  invoiceRef: { type: Schema.Types.ObjectId, ref: "Invoice" },
  dueDate: { type: Date },

  // 💥 NEW FIELD
  isPartial: { type: Boolean, default: false },

  nextDueDate: { type: Date, default: null },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["Paid", "Unpaid", "Partial"], default: "Unpaid" },
  remarks: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

module.exports = PAYMENT_SCHEMA;
