const Customer = require('../models/customer.model');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body || {};
    if (!fullName || !email || !password || !phone) return res.status(400).json({ success: false, message: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (await Customer.findOne({ email })) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const customer = await Customer.create({ fullName, email, phone, password: hashedPassword });
    res.status(201).json({ success: true, message: 'Customer registered successfully', customer: { _id: customer._id, fullName, email, phone } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const customer = await Customer.findOne({ email });
    // Same message for wrong email and wrong password
    if (!customer || !(await bcrypt.compare(password, customer.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    generateToken(res, customer._id);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      customer: { _id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMe = async (req, res) => res.status(200).json(req.user);

exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Old and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const customer = await Customer.findById(req.user._id);
    if (!(await bcrypt.compare(oldPassword, customer.password))) return res.status(401).json({ success: false, message: 'Incorrect old password' });
    customer.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await customer.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
