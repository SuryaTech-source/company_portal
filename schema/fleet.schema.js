var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FLEET_SCHEMA = {};

FLEET_SCHEMA.FLEET = {
    vehicleName: String,
    type: String,
    assetCode: String,
    registrationNo: String,
    insuranceNo: String,
    manufactureDate: Date,
    makerName: String,
    cubicCapacity: Number,
    colour: String,
    seatingCapacity: Number,
      isDeployed: { type: Boolean, default: false },

    deployedContract: { type: Schema.Types.ObjectId, ref: "Contract" },
    maintenance: {
        lastMaintenanceDate: Date,
        nextMaintenanceDue: Date,
        lastMaintenanceCost: Number,
        remarks: String
    },

    passingExpiry: Date,

    documents: [{
        documentType: String,
        fileUrl: String
    }],

    status: { type: Number, default: 1 } // 1=Active, 2=Inactive, 0=Deleted
};

module.exports = FLEET_SCHEMA;
