const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const { requireValidId } = require('../utils/objectId');

const CART_FIELDS = 'name price category image stock';

// Every handler answers with the same populated cart so the client can
// replace its state wholesale instead of patching it.
const populateCart = async (customerId) => {
  const customer = await Customer.findById(customerId)
    .populate({ path: 'cart.product', select: CART_FIELDS });
  return customer.cart.filter(item => item.product); // drop rows whose product was deleted
};

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;

    const product = await Product.findById(productId).select('stock name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const customer = await Customer.findById(req.user._id);
    const existing = customer.cart.find(item => item.product.equals(productId));
    const nextQuantity = existing ? existing.quantity + 1 : 1;

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: product.stock === 0
          ? `${product.name} is out of stock`
          : `Only ${product.stock} units of ${product.name} available`
      });
    }

    if (existing) existing.quantity = nextQuantity;
    else customer.cart.push({ product: productId, quantity: 1 });
    await customer.save();

    res.status(200).json({ success: true, message: 'Cart updated', cart: await populateCart(req.user._id) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getCart = async (req, res) => {
  try {
    res.status(200).json({ success: true, cart: await populateCart(req.user._id) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;

    const { quantity } = req.body || {};
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number of at least 1' });
    }

    const product = await Product.findById(productId).select('stock name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const customer = await Customer.findById(req.user._id);
    const existing = customer.cart.find(item => item.product.equals(productId));
    if (!existing) return res.status(404).json({ success: false, message: 'Product not in cart' });

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units of ${product.name} available` });
    }

    existing.quantity = quantity;
    await customer.save();
    res.status(200).json({ success: true, message: 'Cart updated', cart: await populateCart(req.user._id) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;

    const customer = await Customer.findById(req.user._id);
    const before = customer.cart.length;
    customer.cart = customer.cart.filter(item => !item.product.equals(productId));
    if (customer.cart.length === before) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    await customer.save();
    res.status(200).json({ success: true, message: 'Product removed from cart', cart: await populateCart(req.user._id) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
