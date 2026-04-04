const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { list, disponibilidade, create, cancelar } = require('../controllers/reservas.controller');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/disponibilidade', disponibilidade);

router.post(
  '/',
  [
    body('areaId').isInt().withMessage('areaId é obrigatório'),
    body('data').notEmpty().withMessage('Data é obrigatória'),
    body('periodo').isIn(['MANHA', 'TARDE', 'DIA_INTEIRO']).withMessage('Periodo inválido'),
  ],
  validate,
  create
);

router.patch('/:id/cancelar', cancelar);

module.exports = router;
