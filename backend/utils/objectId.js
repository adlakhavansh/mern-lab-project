const mongoose = require('mongoose');

// One guard for every :productId route — Mongoose would otherwise throw a
// CastError and Express would answer 500 where the spec wants 400.
const requireValidId = (res, id) => {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(400).json({ success: false, message: 'Invalid product ID' });
  return false;
};

module.exports = { requireValidId };
