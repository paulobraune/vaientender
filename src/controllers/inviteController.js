const db = require('../utils/db');

async function validateInviteCode(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Invitation code is required"
      });
    }

    // Sempre aceita 0000-0000 ou 00000000 como válido
    if (code === "0000-0000" || code === "00000000") {
      req.session.inviteCode = code;
      
      // Ensure session is saved before responding
      return req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            success: false,
            message: "Error saving session: " + err.message
          });
        }
        
        return res.json({
          success: true,
          message: "Invitation code validated successfully"
        });
      });
    }

    // Check if code exists
    const invites = await db.find('invites', { _id: code });

    if (!invites || invites.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation code"
      });
    }

    const invite = invites[0];

    // Check if code is already used
    if (invite.used === "yes") {
      return res.status(400).json({
        success: false,
        message: "This invitation code has already been used"
      });
    }

    // Mark the invite code as used
    await db.update('invites', invite._id, { used: "yes" });

    // Add the invite code to the session
    req.session.inviteCode = code;
    
    // Ensure session is saved before responding
    return req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          success: false, 
          message: "Error saving session: " + err.message
        });
      }
      
      return res.json({
        success: true,
        message: "Invitation code validated successfully"
      });
    });
  } catch (error) {
    console.error("Error validating invite code:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating invitation code: " + error.message
    });
  }
}

async function saveWaitlistEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required"
      });
    }

    // Check if email already in waitlist
    const waitlist = await db.find('waitlist', { email });

    if (waitlist && waitlist.length > 0) {
      return res.json({
        success: true,
        message: "Email already in waitlist"
      });
    }

    // Save email to waitlist collection
    await db.create('waitlist', {
      email,
      signupDate: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: "Email added to waitlist successfully"
    });
  } catch (error) {
    console.error("Error saving waitlist email:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving email: " + error.message
    });
  }
}

function checkInviteCode(req, res, next) {
  if (
    req.session.inviteCode ||
    req.path === '/invitation' ||
    req.path.startsWith('/api/')
  ) {
    next();
  } else {
    res.redirect('/invitation');
  }
}

module.exports = {
  validateInviteCode,
  saveWaitlistEmail,
  checkInviteCode
};
