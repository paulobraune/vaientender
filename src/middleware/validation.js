function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("auth/login", { error: "Email and password are required" });
  }

  next();
}

function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.render("auth/registration", { error: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("auth/registration", { error: "Invalid email format" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.render("auth/registration", { error: "Password does not meet requirements" });
  }

  next();
}

function validateBusinessCreation(req, res, next) {
  const { businessName, businessType } = req.body;

  if (!businessName || !businessType) {
    return res.status(400).json({
      success: false,
      message: "Business name and type are required"
    });
  }

  next();
}

function validatePixelCreation(req, res, next) {
  const { type, name, id } = req.body;

  if (!type || !name || !id) {
    return res.status(400).json({
      success: false,
      message: "Type, name, and ID are required fields"
    });
  }

  next();
}

module.exports = {
  validateLogin,
  validateRegistration,
  validateBusinessCreation,
  validatePixelCreation
};