const { Router } = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const reservas = require('../controllers/reservas.controller');

const router = Router();

router.use(authenticate);

router.get('/', reservas.list);
router.get('/disponibilidade', reservas.disponibilidade);
router.get('/:id', reservas.getById);

router.post(
  '/',
  [
    body('areaLazerId').isInt({ min: 1 }).withMessage('areaLazerId invalido'),
    body('data').isDate().withMessage('data invalida (use YYYY-MM-DD)'),
    body('periodo')
      .isIn(['MANHA', 'TARDE', 'DIA_INTEIRO'])
      .withMessage('periodo invalido: MANHA, TARDE ou DIA_INTEIRO'),
    body('convidados').optional().isInt({ min: 0 }).withMessage('convidados deve ser numero positivo'),
  ],
  validate,
  reservas.create
);

router.patch('/:id/cancelar', reservas.cancelar);

router.patch(
  '/:id/status',
  authorizeAdmin,
  [
    body('status')
      .isIn(['PENDENTE', 'CONFIRMADA', 'CANCELADA'])
      .withMessage('Status invalido'),
  ],
  validate,
  reservas.updateStatus
);

module.exports = router;
