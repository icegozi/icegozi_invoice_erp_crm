const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    enabled: { type: Boolean, default: true },
    removed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
