const axios = require('axios');

async function findTaxonomy(req, res) {
  try {
    const { productName, category } = req.body;
    const taxonomyFinderUrl = process.env.API_TAXONOMY_FINDER;
    const apiKey = process.env.API_AUTH_KEY;
    const responseLanguage = req.i18n ? req.i18n.language : 'en';

    if (!taxonomyFinderUrl || !apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Taxonomy finder URL or API key not configured.'
      });
    }

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    const requestBody = {
      productName: productName,
      responseLanguage: responseLanguage,
      category: category === 'Any Category' ? 'none' : category
    };

    console.log('Sending taxonomy finder request:', {
      url: taxonomyFinderUrl,
      apiKey: apiKey ? `${apiKey.substring(0, 5)}...` : 'Missing',
      body: requestBody
    });

    const response = await axios.post(taxonomyFinderUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Error finding taxonomy:', error);
    return res.status(500).json({
      success: false,
      message: 'Error finding taxonomy: ' + (error.response?.data?.message || error.message)
    });
  }
}

async function getTaxonomyCategory(req, res) {
  try {
    const { id } = req.body;
    const taxonomyIdUrl = process.env.API_TAXONOMY_ID;
    const apiKey = process.env.API_AUTH_KEY;
    const responseLanguage = req.i18n ? req.i18n.language : 'en';

    if (!taxonomyIdUrl || !apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Taxonomy ID URL or API key not configured.'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Taxonomy ID is required'
      });
    }

    console.log('Sending taxonomy category request:', {
      url: taxonomyIdUrl,
      apiKey: apiKey ? `${apiKey.substring(0, 5)}...` : 'Missing',
      id: id
    });

    const response = await axios.post(taxonomyIdUrl, {
      id: id,
      responseLanguage: responseLanguage
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Error getting taxonomy category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting taxonomy category: ' + (error.response?.data?.message || error.message)
    });
  }
}

module.exports = {
  findTaxonomy,
  getTaxonomyCategory
};