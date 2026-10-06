const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const { requireValidId } = require('../utils/objectId');

const WISHLIST_FIELDS = 'name price category image stock';

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;
    if (!(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    if (customer.wishlist.some(id => id.equals(productId))) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' });
    }

    customer.wishlist.push(productId);
    await customer.save();
    res.status(201).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .populate({ path: 'wishlist', select: WISHLIST_FIELDS });
    // A product deleted after being wishlisted populates as null — drop those
    const wishlist = customer.wishlist.filter(Boolean);
    res.status(200).json({ success: true, count: wishlist.length, wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;

    const customer = await Customer.findById(req.user._id);
    if (!customer.wishlist.some(id => id.equals(productId))) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    customer.wishlist.pull(productId);
    await customer.save();
    res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Bonus: one endpoint the heart button can call in either direction
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!requireValidId(res, productId)) return;
    if (!(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.user._id);
    const saved = customer.wishlist.some(id => id.equals(productId));
    if (saved) customer.wishlist.pull(productId);
    else customer.wishlist.push(productId);
    await customer.save();

    res.status(200).json({ success: true, saved: !saved, count: customer.wishlist.length });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
