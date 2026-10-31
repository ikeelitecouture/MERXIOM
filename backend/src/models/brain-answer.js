const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  question: { type: String, required: true, maxlength: 500 },
  answer: { type: String, required: true, maxlength: 12000 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true, strict: true });

module.exports = mongoose.models.MerxiomBrainAnswer ||
  mongoose.model('MerxiomBrainAnswer', schema);
