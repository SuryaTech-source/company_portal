const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MAINTENANCE_SCHEMA = {};

MAINTENANCE_SCHEMA.MAINTENANCE = {
  vehicle: { type: Schema.Types.ObjectId, ref: "Fleet", required: true },
  driver: { type: Schema.Types.ObjectId, ref: "Employee" },
  maintenanceDate: { type: Date, default: Date.now },
  maintenanceType: { type: String, required: true },

  // 🧩 updated partsUsed schema
  partsUsed: [
    {
      part: { type: Schema.Types.ObjectId, ref: "Sparepart", required: true },
      quantity: { type: Number, required: true },
      pricePerUnit: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
    },
  ],

  extraCharges: { type: Number, default: 0 },
  maintenanceCost: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  status: { type: Number, default: 1 },
};

module.exports = MAINTENANCE_SCHEMA;
