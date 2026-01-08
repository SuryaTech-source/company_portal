var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ALLOWANCE_SCHEMA = {};

ALLOWANCE_SCHEMA.ALLOWANCE = {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    notes: String,

    // Tracking status
    repaidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Partial", "Paid"], default: "Pending" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
};

module.exports = ALLOWANCE_SCHEMA;
