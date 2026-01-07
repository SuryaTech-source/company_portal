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
  designation: { type: String, enum: ["Mechanic", "Helper", "Supervisor", "Driver", "Others"] },
  employeeId: { type: String, unique: true },
  employmentType: { type: String, enum: ["Full-Time", "Part-Time", "Contract"] },
  dateOfJoining: Date,
  underContract: String,
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

  civilId: String,
  civilIdExpiry: Date,
  visaExpiry: Date,
  licenseNo: String,
  licenseExpiry: Date,

  role: { type: String, enum: ["Driver", "Staff", "Mechanic", "Helper", "Supervisor", "Others"], required: true },

  documents: [{
    documentType: String,
    fileUrl: String
  }],

  vacations: [{
    startDate: Date,
    endDate: Date,
    type: { type: String, enum: ["Vacation", "Sick Leave"], default: "Vacation" },
    remarks: String,
    createdAt: { type: Date, default: Date.now }
  }],

  status: { type: Number, default: 1 }
};

module.exports = EMPLOYEE_SCHEMA;
