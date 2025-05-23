const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productVideoSchema = new Schema({
  businessId: { type: String, required: true },
  productId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  viewUrl: { type: String, required: true },
  downloadUrl: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

const ProductVideo = mongoose.model('ProductVideo', productVideoSchema);

module.exports = ProductVideo;