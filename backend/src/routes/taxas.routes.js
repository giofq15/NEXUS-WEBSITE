const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { list, listAll, create, updateStatus } = require('../controllers/taxas.controller');

const router = Router();

router.use(authenticate);

// Morador vê suas próprias taxas
router.get('/', list);

// Admin vê todas as taxas (com filtros)
router.get('/admin', authorizeAdmin, listAll);

router.post(
  '/',
  authorizeAdmin,
  [
    body('moradorId').isInt().withMessage('moradorId é obrigatório'),
    body('mes').isInt({ min: 1, max: 12 }).withMessage('Mês inválido'),
    body('ano').isInt({ min: 2020 }).withMessage('Ano inválido'),
    body('valor').isFloat({ min: 0 }).withMessage('Valor inválido'),
    body('vencimento').notEmpty().withMessage('Vencimento é obrigatório'),
  ],
  validate,
  create
);

router.patch('/:id/status', authorizeAdmin, updateStatus);

module.exports = router;
