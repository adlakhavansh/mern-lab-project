const Razorpay = require('razorpay');

let client = null;

// Lazy on purpose: the app boots and every non-payment route works before
// the Test Mode keys exist in .env.
const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getClient = () => {
  if (!isConfigured()) throw new Error('Razorpay keys are not configured');
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return client;
};

module.exports = { getClient, isConfigured };
