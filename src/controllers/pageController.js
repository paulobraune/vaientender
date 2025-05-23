const db = require('../utils/db');
const businessController = require('./businessController');

function renderAnalyticsVisitors(req, res) {
  res.render('pages/Analytics/visitors', { pageTitle: 'Visitors Analytics' });
}

function renderAnalyticsBehaviour(req, res) {
  res.render('pages/Analytics/behaviour', { pageTitle: 'Behaviour Analytics' });
}

function renderAnalyticsAcquisition(req, res) {
  res.render('pages/Analytics/acquisition', {
    pageTitle: 'Acquisition Analytics',
  });
}

function renderAnalyticsEcommerce(req, res) {
  res.render('pages/Analytics/ecommerce', { pageTitle: 'Ecommerce Analytics' });
}

function renderAnalyticsRealtime(req, res) {
  res.render('pages/Analytics/realtime', { pageTitle: 'Real-Time Analytics' });
}

function renderTaxonomyFinder(req, res) {
  res.render('pages/Catalog/taxonomy-finder', { pageTitle: 'Taxonomy Finder' });
}

async function renderAllFeeds(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    const allFeeds = await db.getAll('feeds');
    const businessFeeds = activeBusiness
      ? allFeeds.filter((feed) => feed.businessId === activeBusiness._id)
      : [];
    res.render('pages/Catalog/list-all-feeds', {
      pageTitle: 'Listar Feeds',
      feeds: businessFeeds,
    });
  } catch (error) {
    console.error('Error rendering feeds page:', error);
    res.render('pages/Catalog/list-all-feeds', {
      pageTitle: 'Listar Feeds',
      feeds: [],
      error: 'Erro ao carregar feeds.',
    });
  }
}

function renderCreateNewFeed(req, res) {
  res.render('pages/Catalog/create-new-feed', { pageTitle: 'Criar Novo Feed' });
}

function renderProducts(req, res) {
  res.render('pages/Catalog/products', { pageTitle: 'Products Catalog' });
}

async function renderAllPixels(req, res) {
  try {
    const allPixels = await db.getAll('pixels');
    const businessId = res.locals.activeBusiness
      ? res.locals.activeBusiness._id
      : null;
    const pixels = businessId
      ? allPixels.filter((pixel) => pixel.businessId === businessId)
      : [];
    res.render('pages/Pixels/list-all-pixels', {
      pageTitle: 'Listar Pixels',
      pixels,
    });
  } catch (error) {
    console.error('Error rendering pixels page:', error);
    res.render('pages/Pixels/list-all-pixels', {
      pageTitle: 'Listar Pixels',
      pixels: [],
      error: 'Erro ao carregar pixels.',
    });
  }
}

function renderAddNewPixel(req, res) {
  res.render('pages/Pixels/add-new-pixel', { pageTitle: 'Adicionar Pixel' });
}

function renderPixelSettings(req, res) {
  res.render('pages/Pixels/pixel-settings', {
    pageTitle: 'Configurações de Pixel',
  });
}

function renderCookieBar(req, res) {
  res.render('pages/Tools/cookie-bar', { pageTitle: 'Barra de Cookies' });
}

function renderSettings(req, res) {
  res.render('pages/Settings/index', { pageTitle: 'Configurações' });
}

async function renderAccountSettings(req, res) {
  try {
    const user = await db.getById('users', req.session.user.id);
    if (user) {
      delete user.password;
    }
    res.render('pages/Settings/account', {
      pageTitle: 'Meu Perfil',
      user: user || req.session.user,
    });
  } catch (error) {
    console.error('Error rendering account settings:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar os dados do perfil.',
      });
  }
}

async function renderBusinessSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness && req.originalUrl !== '/create-business') {
      return res.redirect('/create-business');
    }
    res.render('pages/Settings/business', {
      pageTitle: 'Meu Negócio',
      activeBusiness,
    });
  } catch (error) {
    console.error('Error rendering business settings:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar as configurações do negócio.',
      });
  }
}

async function renderBillingSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness && req.originalUrl !== '/create-business') {
      return res.redirect('/create-business');
    }
    res.render('pages/Settings/billing', {
      pageTitle: 'Informações Fiscais',
      activeBusiness,
    });
  } catch (error) {
    console.error('Error rendering billing settings:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar as informações fiscais.',
      });
  }
}

async function renderIntegrationsSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness && req.originalUrl !== '/create-business') {
      return res.redirect('/create-business');
    }
    res.render('pages/Settings/integrations', {
      pageTitle: 'Integrações',
      activeBusiness,
    });
  } catch (error) {
    console.error('Error rendering integrations settings:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar as integrações.',
      });
  }
}

async function renderSubscriptionSettings(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness && req.originalUrl !== '/create-business') {
      return res.redirect('/create-business');
    }

    const allInvoices = await db.getAll('invoices');
    const businessInvoices = allInvoices.filter(invoice => invoice.businessId === activeBusiness._id);
    
    res.render('pages/Settings/subscription', {
      pageTitle: 'Assinatura',
      activeBusiness,
      invoices: businessInvoices,
    });
  } catch (error) {
    console.error('Error rendering subscription settings:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar as informações da assinatura.',
      });
  }
}

async function renderPlansSelection(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    if (!activeBusiness && req.originalUrl !== '/create-business') {
      return res.redirect('/create-business');
    }
    
    const needsCountry = !activeBusiness.billingInfo || !activeBusiness.billingInfo.country;
    
    res.render('pages/Settings/plans', {
      pageTitle: 'Escolher Plano',
      activeBusiness,
      needsCountry
    });
  } catch (error) {
    console.error('Error rendering plans selection:', error);
    res
      .status(500)
      .render('error', {
        pageTitle: 'Erro',
        error: 'Não foi possível carregar os planos disponíveis.',
      });
  }
}

function renderError(req, res) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).render('error', {
    pageTitle: `Error ${statusCode}`,
    error: 'An error occurred',
  });
}

function renderPartialContent(req, res) {
  const page = req.params.page;
  res.render(`pages/${page}`, {
    pageTitle: page.charAt(0).toUpperCase() + page.slice(1),
    layout: false,
    user: req.session.user,
    activeBusiness: res.locals.activeBusiness,
    partialContent: true,
  });
}

async function renderOverview(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);
    
    // Check if the user has chosen to hide getting started
    if (activeBusiness && activeBusiness.hideGettingStarted) {
      // Redirect to the analytics realtime page
      return res.redirect('/analytics/realtime');
    }
    
    let isStep1Complete = false;
    let isStep2Complete = false;
    let isStep3Complete = false;
    let isStep4Complete = false;

    if (activeBusiness) {
      // Get the completion status from the database
      const businessSettings = await db.find('business_settings', { businessId: activeBusiness._id });
      const completedSteps = businessSettings.length > 0 ? businessSettings[0].completedSteps || [] : [];

      // Check if steps are complete either based on current state or previous completion
      isStep1Complete = (activeBusiness.plan && activeBusiness.plan !== 'none') || completedSteps.includes('step1');
      isStep2Complete = (activeBusiness.integration && activeBusiness.integration !== 'none') || completedSteps.includes('step2');

      const businessPixels = await db.find('pixels', { businessId: activeBusiness._id });
      isStep3Complete = (businessPixels && businessPixels.length > 0) || completedSteps.includes('step3');

      const businessFeeds = await db.find('feeds', { businessId: activeBusiness._id });
      isStep4Complete = (businessFeeds && businessFeeds.length > 0) || completedSteps.includes('step4');

      // Update completed steps in the database if any steps were completed
      const newCompletedSteps = [];
      if (isStep1Complete) newCompletedSteps.push('step1');
      if (isStep2Complete) newCompletedSteps.push('step2');
      if (isStep3Complete) newCompletedSteps.push('step3');
      if (isStep4Complete) newCompletedSteps.push('step4');

      // Only update if necessary to avoid excessive database writes
      if (completedSteps.length !== newCompletedSteps.length || 
          !completedSteps.every(step => newCompletedSteps.includes(step))) {
        
        if (businessSettings.length > 0) {
          await db.update('business_settings', businessSettings[0]._id, { completedSteps: newCompletedSteps });
        } else {
          await db.create('business_settings', { 
            businessId: activeBusiness._id,
            completedSteps: newCompletedSteps
          });
        }
      }
    }

    res.render('pages/overview', {
      pageTitle: 'Getting Started',
      activeBusiness: activeBusiness,
      isStep1Complete: isStep1Complete,
      isStep2Complete: isStep2Complete,
      isStep3Complete: isStep3Complete,
      isStep4Complete: isStep4Complete
    });
  } catch (error) {
    console.error("Error rendering overview:", error);
    res.render('pages/overview', {
      pageTitle: 'Getting Started',
      activeBusiness: null,
      isStep1Complete: false,
      isStep2Complete: false,
      isStep3Complete: false,
      isStep4Complete: false,
      error: "Erro ao carregar dados do checklist."
    });
  }
}

module.exports = {
  renderOverview,
  renderAnalyticsVisitors,
  renderAnalyticsBehaviour,
  renderAnalyticsAcquisition,
  renderAnalyticsEcommerce,
  renderAnalyticsRealtime,
  renderTaxonomyFinder,
  renderAllFeeds,
  renderCreateNewFeed,
  renderProducts,
  renderAllPixels,
  renderAddNewPixel,
  renderPixelSettings,
  renderCookieBar,
  renderSettings,
  renderAccountSettings,
  renderBusinessSettings,
  renderBillingSettings,
  renderIntegrationsSettings,
  renderSubscriptionSettings,
  renderPlansSelection,
  renderError,
  renderPartialContent,
};