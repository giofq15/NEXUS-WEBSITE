const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const pagamentos = require('../controllers/pagamentos.controller');

const router = Router();

router.post('/asaas/webhook', pagamentos.webhook);

router.use(authenticate);

router.get('/asaas/config', authorizeAdmin, pagamentos.getConfig);
router.get('/asaas/taxas', pagamentos.listTaxaCharges);

router.post(
  '/asaas/taxas/:id/cobranca',
  [
    param('id').isInt({ min: 1 }).withMessage('id da taxa invalido'),
    body('billingType')
      .optional()
      .isIn(['PIX', 'BOLETO'])
      .withMessage('billingType invalido: use PIX ou BOLETO'),
    body('customerCpfCnpj')
      .optional()
      .isString()
      .withMessage('customerCpfCnpj invalido'),
    body('customerEmail')
      .optional()
      .isEmail()
      .withMessage('customerEmail invalido'),
    body('customerPhone')
      .optional()
      .isString()
      .withMessage('customerPhone invalido'),
    body('dueDate')
      .optional()
      .isDate()
      .withMessage('dueDate invalida (use YYYY-MM-DD)'),
  ],
  validate,
  pagamentos.createTaxaCharge
);

module.exports = router;
