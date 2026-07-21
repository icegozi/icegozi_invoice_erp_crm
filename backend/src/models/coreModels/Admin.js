const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
  },
  organizationId: { type: mongoose.Schema.ObjectId, ref: 'Organization', index: true },
});

adminSchema.index({ organizationId: 1, email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Admin', adminSchema);
