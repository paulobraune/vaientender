const db = require('../utils/db');

async function getActiveBusiness(req, res, next) {
  if (req.session && req.session.user && req.session.activeBusiness) {
    try {
      const activeBusiness = await db.getById('businesses', req.session.activeBusiness);
      if (activeBusiness) {
        res.locals.activeBusiness = activeBusiness;
      } else {
        console.log(`Active business not found in database: ${req.session.activeBusiness}`);
      }
    } catch (error) {
      console.error("Error fetching active business:", error);
    }
  }
  next();
}

module.exports = {
  getActiveBusiness
};