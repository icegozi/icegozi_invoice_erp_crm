const mongoose = require('mongoose');

const paymentModeSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
  },
  ref: {
    type: String,
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

paymentModeSchema.index({ organizationId: 1, enabled: 1, isDefault: 1 });

module.exports = mongoose.model('PaymentMode', paymentModeSchema);
