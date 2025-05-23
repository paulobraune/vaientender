function syncLanguage(req, res, next) {
  if (req.query.lng && req.i18n.options.supportedLngs.includes(req.query.lng)) {
    res.cookie('i18next', req.query.lng, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      path: '/'
    });
  }
  next();
}

module.exports = {
  syncLanguage
};