const mongoose = require('mongoose');
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  // Product references, not copies: the Product collection stays the source of truth
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  // Quantity is the one thing a cart needs that a wishlist does not
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
  }]
}, { timestamps: true });
module.exports = mongoose.model('Customer', customerSchema);
