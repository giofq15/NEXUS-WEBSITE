const { Router } = require('express');
const { sse } = require('../controllers/notificacoes.controller');

const router = Router();

// Token via query param porque EventSource não suporta headers customizados
router.get('/sse', sse);

module.exports = router;
