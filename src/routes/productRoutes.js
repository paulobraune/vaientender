// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Edição de campos customizados
router.post('/products/custom-fields', checkAuth, productController.updateCustomFields);

// Listagem de produtos
router.post('/products', checkAuth, productController.listProducts);

// Sincronização de produtos
router.post('/products/sync', checkAuth, productController.syncProducts);

// Pesquisa de produtos
router.post('/products/search', checkAuth, productController.searchProducts);

module.exports = router;