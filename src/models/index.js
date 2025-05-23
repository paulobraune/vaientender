const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schemas for all collections
const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  referralCode: String,
  role: { type: String, default: 'user' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const businessSchema = new Schema({
  _id: { type: String }, // Allow string IDs for businesses
  name: String,
  type: String,
  integration: Schema.Types.Mixed,
  plan: String,
  currency: String,
  timezone: String,
  planCurrency: String,
  billingPeriod: String,
  domain: String,
  userId: String,
  status: String,
  extraDomains: [String],
  billingInfo: Schema.Types.Mixed,
  matomoId: String,
  lagobillingId: String,
  gtmId: String,
  billingStatus: String,
  gatewayUrl: String,
  hideGettingStarted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const businessUserSchema = new Schema({
  userId: String,
  businessId: String,
  role: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const businessSettingsSchema = new Schema({
  businessId: String,
  completedSteps: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const feedSchema = new Schema({
  name: String,
  businessId: String,
  platform: String,
  fileName: String,
  productType: String,
  productCount: String,
  variantCount: String,
  updateFrequency: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the inviteSchema to specifically use String type for _id
const inviteSchema = new Schema({
  _id: { type: String }, // This is the important change - define _id as String type
  used: String,
  updatedAt: { type: Date, default: Date.now }
});

const invoiceSchema = new Schema({
  businessId: String,
  amount: Number,
  currency: String,
  plan: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
  dueDate: Date,
  period: String,
  description: String,
  invoiceNumber: String
});

const pixelSchema = new Schema({
  type: String,
  name: String,
  id: String,
  businessId: String,
  active: { type: Boolean, default: true },
  short: String,
  merchantId: String,
  labels: Schema.Types.Mixed,
  apiKey: String,
  testCode: String,
  accountId: String,
  enableBoleto: Boolean,
  enablePix: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const pixelSettingsSchema = new Schema({
  businessId: String,
  highTicket: Schema.Types.Mixed,
  orderPaid: Schema.Types.Mixed,
  paymentMethod: Schema.Types.Mixed,
  cookieConsent: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const waitlistSchema = new Schema({
  email: { type: String, unique: true },
  signupDate: { type: Date, default: Date.now }
});

const productVideoSchema = new Schema({
  businessId: String,
  productId: String,
  fileName: String,
  fileSize: Number,
  fileType: String,
  viewUrl: String,
  downloadUrl: String,
  uploadDate: { type: Date, default: Date.now }
});

// Create models
const models = {
  User: mongoose.model('User', userSchema),
  Business: mongoose.model('Business', businessSchema),
  BusinessUser: mongoose.model('BusinessUser', businessUserSchema),
  BusinessSettings: mongoose.model('BusinessSettings', businessSettingsSchema),
  Feed: mongoose.model('Feed', feedSchema),
  Invite: mongoose.model('Invite', inviteSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema),
  Pixel: mongoose.model('Pixel', pixelSchema),
  PixelSettings: mongoose.model('PixelSettings', pixelSettingsSchema),
  Waitlist: mongoose.model('Waitlist', waitlistSchema),
  ProductVideo: mongoose.model('ProductVideo', productVideoSchema)
};

module.exports = models;
