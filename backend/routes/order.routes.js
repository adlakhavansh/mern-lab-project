const express = require('express');
const {
  createPaymentOrder, verifyPayment, getMyOrders, getOrderById, updateOrderStatus
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);

router.post('/create-payment-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

// Lab 06 bonus: a development-only status stepper. Never exposed in production,
// where advancing an order is the seller's action and would need an admin role.
if (process.env.NODE_ENV !== 'production') {
  router.patch('/:id/status', updateOrderStatus);
}

module.exports = router;
