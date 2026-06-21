const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authRequired } = require('../middlewares/auth.middleware');

// Register a new user
router.post('/register', authController.register);

// Login an existing user
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authRequired, authController.changePassword);
router.get('/me', authRequired, authController.me);
// Logout a user
router.post('/logout', authController.logout);

module.exports = router;
