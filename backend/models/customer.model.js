const mongoose = require('mongoose');
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Customer', customerSchema);
