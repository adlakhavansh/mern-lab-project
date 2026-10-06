const express = require('express');
const { register, login, getMe, logout, changePassword } = require('../controllers/customer.controller');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);
module.exports = router;
