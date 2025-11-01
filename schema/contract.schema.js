var CONTRACT_SCHEMA = {};

CONTRACT_SCHEMA.CONTRACT = {
  clientName: { type: String, required: true },
  contractId: { type: String, unique: true },

  startDate: { type: Date },
  endDate: { type: Date },

  // ✅ Changed here
  busesDeployed: { type: Number, default: 0 },
  driversDeployed: { type: Number, default: 0 },

  // ✅ Change contractType to multiple types
  contractType: [{ type: String }],

  contactOfficer: { type: String },
  invoicingDate: { type: Date },
  lastPayment: { type: Date },

  status: { type: Number, enum: [1, 2, 0], default: 1 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

module.exports = CONTRACT_SCHEMA;
