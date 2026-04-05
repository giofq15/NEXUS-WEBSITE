const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { getConfig, updateConfig } = require('../controllers/configuracoes.controller');

// GET é público — mobile precisa buscar sem autenticação
router.get('/', getConfig);
router.put('/', authenticate, authorizeAdmin, updateConfig);

module.exports = router;
