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

  taxName: {
    type: String,
    required: true,
  },
  taxValue: {
    type: Number,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  organizationId: { type: mongoose.Schema.ObjectId, ref: 'Organization', index: true },
  created: {
    type: Date,
    default: Date.now,
  },
});

schema.index({ organizationId: 1, enabled: 1, isDefault: 1 });

module.exports = mongoose.model('Taxes', schema);
