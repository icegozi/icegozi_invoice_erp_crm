const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  name: {
    type: String,
    required: true,
  },
  phone: String,
  country: String,
  address: String,
  email: String,
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  organizationId: { type: mongoose.Schema.ObjectId, ref: 'Organization', index: true },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.index({ organizationId: 1, removed: 1, name: 1 });
schema.index({ organizationId: 1, createdBy: 1, removed: 1 });

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Client', schema);
