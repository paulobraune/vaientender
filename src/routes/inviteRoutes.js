const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');

// API route for validating invitation code
router.post('/api/invite/validate', inviteController.validateInviteCode);

// API route for saving waitlist email
router.post('/api/invite/waitlist', inviteController.saveWaitlistEmail);

// Page route for invitation code entry
router.get('/invitation', (req, res) => {
  res.render("auth/invitation", { pageTitle: "Invitation Code" });
});

module.exports = router;