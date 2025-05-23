const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const productVideoController = require('../controllers/productVideoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .mp4, .mov, .avi, and .wmv files are allowed.'));
    }
  }
});

router.post('/products/videos/upload', checkAuth, upload.single('video'), productVideoController.uploadVideoForProduct);
router.post('/products/videos/remove', checkAuth, productVideoController.deleteVideoForProduct);

module.exports = router;
