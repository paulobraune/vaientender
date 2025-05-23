const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { checkAuth } = require('../middleware/auth');

router.put('/user/profile', checkAuth, userController.updateProfile);

module.exports = router;