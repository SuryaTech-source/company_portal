var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PENALTY_SCHEMA = {};

PENALTY_SCHEMA.PENALTY = {
    employee: { type: Schema.Types.ObjectId, ref: "Employee" }, // Optional initially, populated after driver fetch
    fleet: { type: Schema.Types.ObjectId, ref: "Fleet" }, // Optional
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    reason: String,

    // Tracking status
    paidAmount: { type: Number, default: 0 }, // Amount already deducted from salaries
    status: { type: String, enum: ["Pending", "Partial", "Paid"], default: "Pending" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
};

module.exports = PENALTY_SCHEMA;
