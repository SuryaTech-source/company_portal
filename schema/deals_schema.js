var mongoose = require("mongoose");
var DEALS_SCHEMA = {};
DEALS_SCHEMA.DEALS = {
    driverName: { type: String }, 
    idNo: { type: String }, 
    licenseNo: { type: String }, 
    doj: { type: String }, 
    expiryDate: { type: String }, 
    nationality: { type: String }, 
    nomineeName: { type: String }, 
    // category:  [{type: mongoose.Types.ObjectId, required: true, ref: 'rcategory' }],
    // products: [{ type: mongoose.Types.ObjectId, ref: 'food', required: true }], 
    status: { type: Number, default: 1 }, 
    // color: { type: String, required: true } // Color theme for the deal
};
module.exports = DEALS_SCHEMA;
