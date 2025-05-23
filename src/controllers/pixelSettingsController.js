const db = require('../utils/db');
const businessController = require('./businessController');

async function getPixelSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');
    const businessSettings = allSettings.find(setting => setting.businessId === activeBusiness._id) || null;

    return res.json({
      success: true,
      settings: businessSettings
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching pixel settings: " + error.message
    });
  }
}

async function savePixelSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');

    const existingSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const settingsData = req.body;

    settingsData.businessId = activeBusiness._id;

    let result;
    if (existingSettings) {
      result = await db.update('pixel_settings', existingSettings._id, settingsData);
    } else {
      result = await db.create('pixel_settings', settingsData);
    }

    return res.json({
      success: true,
      message: "Pixel settings saved successfully",
      settings: result
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error saving pixel settings: " + error.message
    });
  }
}

async function getHighTicketSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');
    const businessSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const highTicketSettings = businessSettings?.highTicket || {
      enabled: false,
      threshold: 600,
      eventName: 'Purchase - High Ticket'
    };

    return res.json({
      success: true,
      settings: highTicketSettings
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching high ticket settings: " + error.message
    });
  }
}

async function saveHighTicketSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');

    const existingSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const highTicketSettings = req.body;

    let result;
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        highTicket: highTicketSettings
      };
      result = await db.update('pixel_settings', existingSettings._id, updatedSettings);
    } else {
      const newSettings = {
        businessId: activeBusiness._id,
        highTicket: highTicketSettings
      };
      result = await db.create('pixel_settings', newSettings);
    }

    return res.json({
      success: true,
      message: "High ticket settings saved successfully",
      settings: result.highTicket
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error saving high ticket settings: " + error.message
    });
  }
}

async function getOrderPaidSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');
    const businessSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const orderPaidSettings = businessSettings?.orderPaid || {
      enabled: false,
      delay: 24,
      eventName: 'Purchase - Order Paid',
      trackAllOrders: true
    };

    return res.json({
      success: true,
      settings: orderPaidSettings
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching order paid settings: " + error.message
    });
  }
}

async function saveOrderPaidSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');

    const existingSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const orderPaidSettings = req.body;

    let result;
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        orderPaid: orderPaidSettings
      };
      result = await db.update('pixel_settings', existingSettings._id, updatedSettings);
    } else {
      const newSettings = {
        businessId: activeBusiness._id,
        orderPaid: orderPaidSettings
      };
      result = await db.create('pixel_settings', newSettings);
    }

    return res.json({
      success: true,
      message: "Order paid settings saved successfully",
      settings: result.orderPaid
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error saving order paid settings: " + error.message
    });
  }
}

async function getPaymentMethodSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');
    const businessSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const paymentMethodSettings = businessSettings?.paymentMethod || {
      creditCard: {
        enabled: false,
        eventName: 'Purchase - credit_card'
      },
      pix: {
        enabled: false,
        eventName: 'Purchase - pix'
      },
      billet: {
        enabled: false,
        eventName: 'Purchase - billet'
      }
    };

    return res.json({
      success: true,
      settings: paymentMethodSettings
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching payment method settings: " + error.message
    });
  }
}

async function savePaymentMethodSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');

    const existingSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const paymentMethodSettings = req.body;

    let result;
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        paymentMethod: paymentMethodSettings
      };
      result = await db.update('pixel_settings', existingSettings._id, updatedSettings);
    } else {
      const newSettings = {
        businessId: activeBusiness._id,
        paymentMethod: paymentMethodSettings
      };
      result = await db.create('pixel_settings', newSettings);
    }

    return res.json({
      success: true,
      message: "Payment method settings saved successfully",
      settings: result.paymentMethod
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error saving payment method settings: " + error.message
    });
  }
}

async function getCookieConsentSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');
    const businessSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const cookieConsentSettings = businessSettings?.cookieConsent || {
      enabled: false,
      bannerText: "We use cookies to improve your experience. By clicking 'Accept', you consent to our use of cookies.",
      fontSize: 14,
      buttonStyle: 'single',
      privacyPolicyUrl: '',
      showLogo: true,
      logoType: 'dark',
      logoSize: 16, // Default logo size
      colors: {
        buttonBg: '#3fe45b',
        buttonText: '#ffffff',
        declineButtonBg: '#f0f0f0',
        declineButtonText: '#333333',
        text: '#10b21a',
        link: '#40a216',
        barBg: '#ffffff'
      }
    };

    return res.json({
      success: true,
      settings: cookieConsentSettings
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching cookie consent settings: " + error.message
    });
  }
}

async function saveCookieConsentSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allSettings = await db.getAll('pixel_settings');

    const existingSettings = allSettings.find(setting => setting.businessId === activeBusiness._id);

    const cookieConsentSettings = req.body;
    
    // Calculate logo size from font size if not provided
    if (cookieConsentSettings.fontSize && !cookieConsentSettings.logoSize) {
      cookieConsentSettings.logoSize = Math.max(Math.round(cookieConsentSettings.fontSize * 1.15), 12);
    }

    let result;
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        cookieConsent: cookieConsentSettings
      };
      result = await db.update('pixel_settings', existingSettings._id, updatedSettings);
    } else {
      const newSettings = {
        businessId: activeBusiness._id,
        cookieConsent: cookieConsentSettings
      };
      result = await db.create('pixel_settings', newSettings);
    }

    return res.json({
      success: true,
      message: "Cookie consent settings saved successfully",
      settings: result.cookieConsent
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error saving cookie consent settings: " + error.message
    });
  }
}

module.exports = {
  getPixelSettings,
  savePixelSettings,
  getHighTicketSettings,
  saveHighTicketSettings,
  getOrderPaidSettings,
  saveOrderPaidSettings,
  getPaymentMethodSettings,
  savePaymentMethodSettings,
  getCookieConsentSettings,
  saveCookieConsentSettings
};