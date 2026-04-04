const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const taxas = require('../controllers/taxas.controller');

const router = Router();

router.use(authenticate);

router.get('/', taxas.list);
router.get('/:id', taxas.getById);

router.post(
  '/',
  authorizeAdmin,
  [
    body('moradorId').isInt({ min: 1 }).withMessage('moradorId invalido'),
    body('mes').isInt({ min: 1, max: 12 }).withMessage('mes invalido (1-12)'),
    body('ano').isInt({ min: 2000 }).withMessage('ano invalido'),
    body('valor').isFloat({ min: 0 }).withMessage('valor invalido'),
    body('vencimento').isDate().withMessage('vencimento invalido (YYYY-MM-DD)'),
  ],
  validate,
  taxas.create
);

router.patch('/:id/pago', authorizeAdmin, taxas.marcarPago);

router.patch(
  '/:id/status',
  authorizeAdmin,
  [body('status').isIn(['PAGA', 'PENDENTE', 'ATRASADA']).withMessage('Status invalido')],
  validate,
  taxas.updateStatus
);

module.exports = router;
