// controllers/productController.js

const axios = require('axios');

/**
 * Atualiza produtos com campos customizados
 * Recebe um array products e businessId no body.
 */
async function updateCustomFields(req, res) {
  try {
    const { businessId, products } = req.body;
    if (!businessId || !products || !Array.isArray(products) || !products.length) {
      return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }
    const productEditorUrl = process.env.API_PROD_EDITOR;
    const apiKey = process.env.API_AUTH_KEY;
    const resp = await axios.post(
      productEditorUrl,
      { businessId, products },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );
    return res.status(200).json({ success: resp.data.success, message: resp.data.message, products: resp.data.products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Lista produtos (POST igual ao fetchProducts do frontend)
 */
async function listProducts(req, res) {
  try {
    const { businessId, page = 1, limit = 20, search = '', filters = {} } = req.body;
    if (!businessId) return res.status(400).json({ success: false, message: 'No active business found' });
    const productGetListUrl = process.env.API_PROD_GET_LIST;
    const apiKey = process.env.API_AUTH_KEY;
    const resp = await axios.post(
      productGetListUrl,
      { businessId, page, limit, search, filters },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );
    return res.status(200).json(resp.data);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Sincroniza produtos
 */
async function syncProducts(req, res) {
  try {
    const { businessId } = req.body;
    if (!businessId) return res.status(400).json({ success: false, message: 'No active business found' });
    const syncUrl = process.env.API_PROD_SYNC;
    const apiKey = process.env.API_AUTH_KEY;
    const resp = await axios.post(
      syncUrl,
      { businessId },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );
    return res.status(200).json(resp.data);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Pesquisa produtos
 */
async function searchProducts(req, res) {
  try {
    const { businessId, search_term, filters = {} } = req.body;
    if (!businessId) return res.status(400).json({ success: false, message: 'No active business found' });
    if (!search_term) return res.status(400).json({ success: false, message: 'Search term is required' });
    
    const searchUrl = process.env.API_PROD_SEARCH;
    const apiKey = process.env.API_AUTH_KEY;
    
    const resp = await axios.post(
      searchUrl,
      { businessId, search_term, filters },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      }
    );
    return res.status(200).json(resp.data);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  updateCustomFields,
  listProducts,
  syncProducts,
  searchProducts
};