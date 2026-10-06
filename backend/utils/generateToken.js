const jwt = require('jsonwebtoken');

// Creates a JWT with the customer id and stores it in an HttpOnly cookie
const generateToken = (res, customerId) => {
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 86400000 });
  return token;
};

module.exports = generateToken;
