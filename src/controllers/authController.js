const db = require('../utils/db');

function loginPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/overview");
  }
  res.render("auth/login");
}

function forgotPasswordPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/overview");
  }
  res.render("auth/forgot-password");
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    // In a real implementation, we would:
    // 1. Check if the user exists
    // 2. Generate a reset token
    // 3. Save the token to the database
    // 4. Send an email with the reset link

    // For this demo, we'll just return success regardless of whether the email exists
    // This is a security best practice to prevent email enumeration
    
    return res.json({
      success: true,
      message: "If an account exists with that email, password reset instructions have been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request."
    });
  }
}

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const users = await db.find('users', { email: username, password: password });

    if (users.length > 0) {
      const user = users[0];
      
      // Store complete user information in session (except password)
      req.session.user = { 
        id: user._id,
        username: user.email,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        phone: user.phone || ''
      };

      const businesses = await db.find('businesses', { userId: user._id });
      if (businesses && businesses.length > 0) {
        req.session.activeBusiness = businesses[0]._id;

        const activeBusiness = await db.getById('businesses', businesses[0]._id);
        res.locals.activeBusiness = activeBusiness;
      }

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.render("auth/login", { error: "Erro ao iniciar sessão. Tente novamente." });
        }

        if (businesses && businesses.length > 0) {
          return res.redirect("/overview");
        } else {
          return res.redirect("/create-business");
        }
      });
    } else {
      return res.render("auth/login", { error: "Credenciais inválidas. Por favor, tente novamente." });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.render("auth/login", { error: "Erro ao processar login. Tente novamente." });
  }
}

async function socialLogin(req, res) {
  const { provider } = req.params;

  try {
    const email = `${provider}user@example.com`;
    const name = provider === 'google' ? 'Google User' : 'Facebook User';

    let users = await db.find('users', { email });
    let user;

    if (users.length === 0) {
      user = await db.create('users', {
        name,
        email,
        password: 'social-auth', 
        role: 'user',
        active: true,
        provider
      });
    } else {
      user = users[0];
    }

    // Store complete user information in session
    req.session.user = {
      id: user._id,
      username: user.email,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      phone: user.phone || '',
      provider: provider
    };

    const businesses = await db.find('businesses', { userId: user._id });

    if (businesses && businesses.length > 0) {
      req.session.activeBusiness = businesses[0]._id;
      const activeBusiness = await db.getById('businesses', businesses[0]._id);
      res.locals.activeBusiness = activeBusiness;
    }

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.render("auth/login", { error: "Erro ao iniciar sessão. Tente novamente." });
      }

      if (businesses && businesses.length > 0) {
        return res.redirect("/overview");
      } else {
        return res.redirect("/create-business");
      }
    });

  } catch (error) {
    console.error(`${provider} login error:`, error);
    return res.render("auth/login", { error: `Erro ao processar login com ${provider}.` });
  }
}

function registerPage(req, res) {
  if (req.session && req.session.user) {
    return res.redirect("/overview");
  }
  res.render("auth/registration");
}

async function register(req, res) {
  try {
    const { name, email, password, fullPhone, referralCode } = req.body;

    const existingUsers = await db.find('users', { email });
    if (existingUsers.length > 0) {
      return res.render("auth/registration", { error: "Email already registered" });
    }

    const newUser = await db.create('users', {
      name,
      email,
      password,
      phone: fullPhone,
      referralCode: referralCode,
      role: 'user',
      active: true
    });

    // Store complete user information in session
    req.session.user = {
      id: newUser._id,
      username: newUser.email,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user',
      phone: newUser.phone || ''
    };

    return res.redirect("/create-business");
  } catch (error) {
    console.error("Registration error:", error);
    return res.render("auth/registration", { error: "Error creating account. Please try again." });
  }
}

async function socialRegister(req, res) {
  const { provider } = req.params;

  try {
    const email = `${provider}user@example.com`;
    const name = provider === 'google' ? 'Google User' : 'Facebook User';

    const existingUsers = await db.find('users', { email });

    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      user = await db.create('users', {
        name,
        email,
        password: 'social-auth', 
        role: 'user',
        active: true,
        provider
      });
    }

    // Store complete user information in session
    req.session.user = {
      id: user._id,
      username: user.email,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      phone: user.phone || '',
      provider: provider
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.render("auth/registration", { error: "Erro ao criar sessão. Tente novamente." });
      }

      return res.redirect("/create-business");
    });

  } catch (error) {
    console.error(`${provider} registration error:`, error);
    return res.render("auth/registration", { error: `Erro ao registrar com ${provider}.` });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/login");
  });
}

function createBusinessPage(req, res) {
  res.render("auth/create-business");
}

module.exports = {
  loginPage,
  login,
  forgotPasswordPage,
  forgotPassword,
  socialLogin,
  registerPage,
  register,
  socialRegister,
  logout,
  createBusinessPage
};