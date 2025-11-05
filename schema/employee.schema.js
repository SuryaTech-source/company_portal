var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var EMPLOYEE_SCHEMA = {};

EMPLOYEE_SCHEMA.EMPLOYEE = {
    fullName: { type: String, required: true },
    nationality: String,
    bloodGroup: String,
    dob: Date,
    permanentAddress: String,
    contactNumber: String,
    designation: String,
    employeeId: { type: String, unique: true },
    employmentType: { type: String, enum: ["Full-Time", "Part-Time", "Contract"] },
    dateOfJoining: Date,
    // underContract: { type: Schema.Types.ObjectId, ref: "Contract" },
    underContract : String,
    salary: Number,

    bankDetails: {
        bankName: String,
        accountNo: String,
        ifsc: String
    },

    nominee: {
        name: String,
        relation: String,
        contact: String
    },

    visaExpiry: Date,
    licenseNo: String, // for drivers
    role: { type: String, enum: ["Driver", "Staff"], required: true },

    documents: [{
        documentType: String,
        fileUrl: String
    }],

    status: { type: Number, default: 1 } // 1=Active, 2=Inactive, 0=Deleted
};

module.exports = EMPLOYEE_SCHEMA;
