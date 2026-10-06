const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const { getClient, isConfigured } = require('../config/razorpay');

// Server-side address validation. The client validates too, but the client
// is not a trust boundary.
const validateAddress = (address = {}) => {
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!text(address.fullName)) return 'Full name is required';
  if (!/^[6-9]\d{9}$/.test(String(address.phone || '').trim())) return 'Phone must be a valid 10-digit Indian mobile number';
  if (!text(address.addressLine1)) return 'Address is required';
  if (!text(address.city)) return 'City is required';
  if (!text(address.state)) return 'State is required';
  if (!/^\d{6}$/.test(String(address.pincode || '').trim())) return 'Pincode must contain 6 digits';
  return null;
};

const trimAddress = (address) => ({
  fullName: address.fullName.trim(),
  phone: String(address.phone).trim(),
  addressLine1: address.addressLine1.trim(),
  city: address.city.trim(),
  state: address.state.trim(),
  pincode: String(address.pincode).trim()
});

exports.createPaymentOrder = async (req, res) => {
  try {
    // Anything the client sent about prices or totals is ignored on purpose.
    const addressError = validateAddress(req.body?.shippingAddress);
    if (addressError) return res.status(400).json({ success: false, message: addressError });

    const customer = await Customer.findById(req.user._id).populate('cart.product');
    const cart = customer.cart.filter(item => item.product);
    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }
    if (cart.length !== customer.cart.length) {
      return res.status(400).json({ success: false, message: 'A product in your cart is no longer available' });
    }

    // Fresh stock check against the latest Product documents — stock can have
    // changed since the item was added to the cart.
    const shortage = cart.find(item => item.quantity > item.product.stock);
    if (shortage) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${shortage.product.name}. Only ${shortage.product.stock} left.`
      });
    }

    const items = cart.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: trimAddress(req.body.shippingAddress),
      totalAmount
    });

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.',
        shopKartOrderId: order._id
      });
    }

    const razorpayOrder = await getClient().orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay wants the smallest unit: paise
      currency: 'INR',
      receipt: order._id.toString()
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID // Key ID is public; the secret never leaves the server
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!mongoose.isValidObjectId(shopKartOrderId) || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Incomplete payment details' });
    }

    // Scoped by user: nobody confirms somebody else's order
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }
    if (!order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Order has no payment attached' });
    }

    // The trusted order id is the one stored on the order, never one from the body
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest('hex');

    const provided = Buffer.from(String(razorpay_signature));
    const expected = Buffer.from(expectedSignature);
    const signatureValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

    if (!signatureValid) {
      order.paymentStatus = 'FAILED';
      await order.save();
      // Cart deliberately untouched
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Only now is it safe to empty the cart
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    res.status(200).json({ success: true, message: 'Payment verified', order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    // Ownership is part of the query, so another customer's id simply does not match
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Bonus: order status progression. A development helper, as the lab allows —
// the route is only registered outside production (see routes/order.routes.js),
// because in a real shop the seller moves an order along, not the buyer.
const PROGRESSION = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!PROGRESSION.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of ${PROGRESSION.join(', ')}` });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Only paid orders can progress' });
    }

    // Forward-only: an order cannot be walked back to an earlier stage
    if (PROGRESSION.indexOf(status) <= PROGRESSION.indexOf(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Status can only move forward, and this order is already ${order.status}`
      });
    }

    order.status = status;
    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
