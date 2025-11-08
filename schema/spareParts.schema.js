var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var SPAREPART_SCHEMA = {};

SPAREPART_SCHEMA.SPAREPART = {
  name: { type: String, required: true },
  partNumber: { type: String, unique: true },
  totalQuantity: { type: Number, default: 0 },

  discount: { type: Number, default: 0 },        // ✅ new field
  finalPrice: { type: Number, default: 0 },      // ✅ new field

  addedBatches: [
    {
      quantity: Number,
      pricePerUnit: Number,
      discount: Number,                          // ✅ store batch discount
      finalPrice: Number,                        // ✅ store batch final price
      supplier: String,
      addedDate: { type: Date, default: Date.now },
    },
  ],

  status: { type: Number, default: 1 },
};


module.exports = SPAREPART_SCHEMA;
