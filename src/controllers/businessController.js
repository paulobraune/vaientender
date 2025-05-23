const db = require('../utils/db');

async function createBusiness(req, res) {
  try {
    const { businessName, businessType, integration, plan, currency, timezone, planCurrency, billingPeriod, domain } = req.body;

    // Convert timezone (like America/Sao_Paulo) to UTC offset (like -03:00)
    let utcOffset = '-00:00'; // Default UTC
    if (timezone) {
      try {
        // Create a date object in the specified timezone
        const date = new Date();
        const options = { timeZone: timezone, timeZoneName: 'short' };
        const timeString = date.toLocaleString('en-US', options);
        
        // Extract the UTC offset from the timezone string
        const match = timeString.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
        if (match && match[1]) {
          // Format the offset to always have 2 digits for hours and include minutes
          let offset = match[1];
          if (offset.length === 3) { // If format is like +1 or -1
            offset = offset.replace(/([+-])(\d)/, '$10$2:00');
          } else if (!offset.includes(':')) { // If format is like +10 or -10
            offset = offset + ':00';
          }
          utcOffset = offset;
        }
      } catch (error) {
        console.error(`Error converting timezone ${timezone} to UTC offset:`, error);
      }
    }

    const newBusiness = await db.create('businesses', {
      name: businessName,
      type: businessType,
      integration: integration || 'none',
      plan: plan || 'none',
      currency: currency || 'BRL',
      timezone: utcOffset, // Store the UTC offset
      planCurrency: planCurrency || 'BRL',
      billingPeriod: billingPeriod || 'none',
      domain: domain || '',
      userId: req.session.user.id,
      status: 'active',
      extraDomains: [],
      billingInfo: null,
      matomoId: null,
      lagobillingId: null,
      gtmId: null,
      billingStatus: 'none',
      gatewayUrl: null,
      hideGettingStarted: false // Initialize with false
    });

    const businessUser = await db.create('business_users', {
      userId: req.session.user.id,
      businessId: newBusiness._id,
      role: 'admin',
      status: 'active'
    });

    req.session.activeBusiness = newBusiness._id;

    return res.status(201).json({
      success: true,
      message: "Business created successfully",
      business: newBusiness,
      businessUser: businessUser
    });
  } catch (error) {
    console.error("Error creating business:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating business: " + error.message
    });
  }
}

async function getUserBusinesses(req, res) {
  try {
    const userId = req.session.user.id;
    const businesses = await getAllUserBusinesses(userId);
    const activeBusiness = req.session.activeBusiness || '';

    return res.json({
      success: true,
      businesses: businesses,
      activeBusiness: activeBusiness
    });
  } catch (error) {
    console.error("Error fetching user businesses:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching businesses: " + error.message
    });
  }
}

async function setActiveBusiness(req, res) {
  try {
    const { businessId } = req.body;
    const userId = req.session.user.id;

    const business = await db.getById('businesses', businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }

    const userBusinesses = await getAllUserBusinesses(userId);
    const hasAccess = userBusinesses.some(b => b._id === businessId);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "You don't have access to this business" });
    }

    req.session.activeBusiness = businessId;

    req.session.save(err => {
      if (err) {
        console.error("Error saving session after setting active business:", err);
        return res.status(500).json({ success: false, message: "Error saving session." });
      }
      res.locals.activeBusiness = business;
      return res.json({
        success: true,
        message: "Active business set successfully",
        business: business
      });
    });

  } catch (error) {
    console.error("Error setting active business:", error);
    return res.status(500).json({ success: false, message: "Error setting active business: " + error.message });
  }
}

async function getActiveBusinessInfo(req, res) {
  try {
    const activeBusiness = res.locals.activeBusiness;

    if (!activeBusiness) {
      const foundBusiness = await getActiveBusinessById(req);
      if (!foundBusiness) {
        return res.status(404).json({ success: false, message: "No active business found or set." });
      }
      res.locals.activeBusiness = foundBusiness;
      return res.json({ success: true, business: foundBusiness });
    }

    return res.json({ success: true, business: activeBusiness });
  } catch (error) {
    console.error("Error fetching active business info:", error);
    return res.status(500).json({ success: false, message: "Error fetching active business: " + error.message });
  }
}

async function getActiveBusinessById(req) {
  try {
    if (req.session && req.session.activeBusiness) {
      const business = await db.getById('businesses', req.session.activeBusiness);
      if (business) {
        const userBusinesses = await getAllUserBusinesses(req.session.user.id);
        if (userBusinesses.some(b => b._id === business._id)) {
          return business;
        } else {
          delete req.session.activeBusiness;
        }
      } else {
        delete req.session.activeBusiness;
      }
    }

    const userId = req.session.user.id;
    const userBusinesses = await getAllUserBusinesses(userId);

    if (userBusinesses.length > 0) {
      const firstBusiness = userBusinesses[0];
      req.session.activeBusiness = firstBusiness._id;
      return firstBusiness;
    }

    return null;
  } catch (error) {
    console.error("Error getting active business by ID:", error);
    return null;
  }
}

async function getAllUserBusinesses(userId) {
  try {
    let accessibleBusinesses = [];

    const ownedBusinesses = await db.find('businesses', { userId: userId });
    accessibleBusinesses = [...ownedBusinesses];

    const businessUserEntries = await db.find('business_users', { userId: userId, status: 'active' });

    for (const busUser of businessUserEntries) {
      if (!accessibleBusinesses.some(b => b._id === busUser.businessId)) {
        const sharedBusiness = await db.getById('businesses', busUser.businessId);
        if (sharedBusiness) {
          accessibleBusinesses.push({ ...sharedBusiness, userRoleInBusiness: busUser.role });
        }
      } else {
        const existingIndex = accessibleBusinesses.findIndex(b => b._id === busUser.businessId);
        if (existingIndex !== -1 && !accessibleBusinesses[existingIndex].userRoleInBusiness) {
          accessibleBusinesses[existingIndex].userRoleInBusiness = busUser.role;
        }
      }
    }

    return accessibleBusinesses;
  } catch (error) {
    console.error(`Error fetching businesses for user ${userId}:`, error);
    return [];
  }
}

async function updateBusinessSettings(req, res) {
  try {
    const activeBusinessId = req.session.activeBusiness;
    if (!activeBusinessId) {
      return res.status(400).json({ success: false, message: "Nenhum negócio ativo selecionado." });
    }

    const business = await db.getById('businesses', activeBusinessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Negócio ativo não encontrado." });
    }

    const { domain, extraDomains, timezone, currency } = req.body;

    if (!timezone || !currency) {
      return res.status(400).json({ success: false, message: "Fuso horário e moeda são obrigatórios." });
    }

    // Convert timezone (like America/Sao_Paulo) to UTC offset (like -03:00)
    let utcOffset = '-00:00'; // Default UTC
    if (timezone) {
      try {
        // Create a date object in the specified timezone
        const date = new Date();
        const options = { timeZone: timezone, timeZoneName: 'short' };
        const timeString = date.toLocaleString('en-US', options);
        
        // Extract the UTC offset from the timezone string
        const match = timeString.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
        if (match && match[1]) {
          // Format the offset to always have 2 digits for hours and include minutes
          let offset = match[1];
          if (offset.length === 3) { // If format is like +1 or -1
            offset = offset.replace(/([+-])(\d)/, '$10$2:00');
          } else if (!offset.includes(':')) { // If format is like +10 or -10
            offset = offset + ':00';
          }
          utcOffset = offset;
        }
      } catch (error) {
        console.error(`Error converting timezone ${timezone} to UTC offset:`, error);
      }
    }

    const updateData = {
      domain: domain || '',
      extraDomains: Array.isArray(extraDomains) ? extraDomains : [],
      timezone: utcOffset, // Store the UTC offset instead of the timezone name
      currency
    };

    const updatedBusiness = await db.update('businesses', activeBusinessId, updateData);
    res.locals.activeBusiness = updatedBusiness;

    return res.json({ success: true, message: "Configurações do negócio salvas com sucesso!", business: updatedBusiness });

  } catch (error) {
    console.error("Error updating business settings:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao salvar configurações do negócio." });
  }
}

async function updateBillingInfo(req, res) {
  try {
    const activeBusinessId = req.session.activeBusiness;
    if (!activeBusinessId) {
      return res.status(400).json({ success: false, message: "Nenhum negócio ativo selecionado." });
    }

    const business = await db.getById('businesses', activeBusinessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Negócio ativo não encontrado." });
    }

    const billingData = req.body;

    if (!billingData.type || !billingData.name || !billingData.taxId || !billingData.country || !billingData.address1 || !billingData.zipcode || !billingData.city || !billingData.state) {
      return res.status(400).json({ success: false, message: "Todos os campos fiscais obrigatórios devem ser preenchidos." });
    }

    const updatedBusiness = await db.update('businesses', activeBusinessId, { billingInfo: billingData });
    res.locals.activeBusiness = updatedBusiness;

    return res.json({ success: true, message: "Informações fiscais salvas com sucesso!", billingInfo: updatedBusiness.billingInfo });

  } catch (error) {
    console.error("Error updating billing info:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao salvar informações fiscais." });
  }
}

async function updateIntegration(req, res) {
  try {
    const activeBusinessId = req.session.activeBusiness;
    if (!activeBusinessId) {
      return res.status(400).json({ success: false, message: "Nenhum negócio ativo selecionado." });
    }

    const business = await db.getById('businesses', activeBusinessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Negócio ativo não encontrado." });
    }

    const integrationData = req.body;

    if (!integrationData.platform || integrationData.platform !== 'shopify') {
      return res.status(400).json({ success: false, message: "Plataforma de integração inválida ou não suportada." });
    }
    if (!integrationData.adminApiAccessToken || !integrationData.shopDomain) {
      return res.status(400).json({ success: false, message: "Token de acesso e domínio Shopify são obrigatórios." });
    }
    if (!integrationData.checkoutType || !['shopify', 'yampi', 'cartpanda'].includes(integrationData.checkoutType)) {
      return res.status(400).json({ success: false, message: "Tipo de checkout inválido." });
    }
    if ((integrationData.checkoutType === 'yampi' || integrationData.checkoutType === 'cartpanda') && !integrationData.checkoutDomain) {
      return res.status(400).json({ success: false, message: "Domínio do Checkout Transparente é obrigatório para Yampi/CartPanda." });
    }
    if (integrationData.checkoutType === 'shopify') {
      integrationData.checkoutDomain = null;
    }

    const updatedBusiness = await db.update('businesses', activeBusinessId, { integration: integrationData });
    res.locals.activeBusiness = updatedBusiness;

    return res.json({ success: true, message: `Integração ${integrationData.platform} salva com sucesso!`, integration: updatedBusiness.integration });

  } catch (error) {
    console.error("Error updating integration:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao salvar integração." });
  }
}

async function deleteIntegration(req, res) {
  try {
    const activeBusinessId = req.session.activeBusiness;
    if (!activeBusinessId) {
      return res.status(400).json({ success: false, message: "Nenhum negócio ativo selecionado." });
    }

    const business = await db.getById('businesses', activeBusinessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Negócio ativo não encontrado." });
    }

    const updatedBusiness = await db.update('businesses', activeBusinessId, { integration: null });
    res.locals.activeBusiness = updatedBusiness;

    return res.json({ success: true, message: `Integração desconectada com sucesso!` });

  } catch (error) {
    console.error("Error deleting integration:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao desconectar integração." });
  }
}

// New function to handle hiding the Getting Started page
async function hideGettingStarted(req, res) {
  try {
    const { businessId } = req.body;
    const activeBusinessId = businessId || req.session.activeBusiness;
    
    if (!activeBusinessId) {
      return res.status(400).json({
        success: false,
        message: "Nenhum negócio ativo selecionado."
      });
    }

    const business = await db.getById('businesses', activeBusinessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Negócio ativo não encontrado."
      });
    }

    // Ensure the user has access to this business
    const userBusinesses = await getAllUserBusinesses(req.session.user.id);
    const hasAccess = userBusinesses.some(b => b._id === activeBusinessId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para modificar este negócio."
      });
    }

    // Update business to hide Getting Started
    const updatedBusiness = await db.update('businesses', activeBusinessId, {
      hideGettingStarted: true
    });

    res.locals.activeBusiness = updatedBusiness;

    return res.json({
      success: true,
      message: "Configuração salva com sucesso!",
      business: updatedBusiness
    });

  } catch (error) {
    console.error("Error hiding Getting Started page:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao salvar configuração: " + error.message
    });
  }
}

module.exports = {
  createBusiness,
  getUserBusinesses,
  setActiveBusiness,
  getActiveBusinessInfo,
  getActiveBusinessById,
  getAllUserBusinesses,
  updateBusinessSettings,
  updateBillingInfo,
  updateIntegration,
  deleteIntegration,
  hideGettingStarted
};