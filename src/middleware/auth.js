function checkAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  if (req.xhr) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return res.redirect("/login");
}

function checkInviteCode(req, res, next) {
  // Skip invite check for login page and API routes
  if (req.path === '/login' || 
      req.path === '/invitation' || 
      req.path === '/forgot-password' ||
      req.path.startsWith('/api/invite/') ||
      req.path.startsWith('/api/taxonomy/') ||  // Allow taxonomy API routes
      req.path === '/logout') {
    return next();
  }
  
  // If trying to access register page or any other protected page
  if (req.path === '/register') {
    if (req.session && req.session.inviteCode) {
      return next();
    } else {
      return res.redirect('/invitation');
    }
  }
  
  // For all other pages, check auth as usual
  return checkAuth(req, res, next);
}

module.exports = {
  checkAuth,
  checkInviteCode
};
