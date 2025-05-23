const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateRegistration } = require('../middleware/validation');
const { checkAuth, checkInviteCode } = require('../middleware/auth');

router.get('/login', authController.loginPage);
router.post('/login', validateLogin, authController.login);

router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);

router.post('/social-login/:provider', authController.socialLogin);

router.get('/register', checkInviteCode, authController.registerPage);
router.post('/register', checkInviteCode, validateRegistration, authController.register);

router.post('/social-register/:provider', authController.socialRegister);

router.get('/logout', authController.logout);

router.get('/create-business', checkAuth, authController.createBusinessPage);

module.exports = router;