const fs = require('fs').promises;
const path = require('path');
const { DB_DIR } = require('./database-config');

async function init() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // Ignore errors for directory creation
  }
}

init();

module.exports = {
  DB_DIR
};