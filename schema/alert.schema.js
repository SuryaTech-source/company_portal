var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ALERT_SCHEMA = {};

const ALERT_TYPES = [
  'payment_due',                // vendor / customer partial payment
  'employee_license_expiry',
  'employee_visa_expiry',
  'employee_contract_expiry',
  'employee_civilid_expiry',    // 🔥 ADD THIS
  'fleet_insurance_expiry',
  'fleet_maintenance_due'
];

ALERT_SCHEMA.ALERT = {
  type: { type: String, enum: ALERT_TYPES, required: true },
  message: { type: String, required: true },

  paymentId: { type: Schema.Types.ObjectId, ref: 'VendorPayment' },
  customerPaymentId: { type: Schema.Types.ObjectId, ref: 'CustomerPayment' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  fleetId: { type: Schema.Types.ObjectId, ref: 'Fleet' },
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract' },

  alertDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },

  // delete 10 days after alertDate
  expireAt: { type: Date, index: { expireAfterSeconds: 0 } },

  meta: { type: Schema.Types.Mixed }
};


module.exports = ALERT_SCHEMA;