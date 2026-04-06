const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const turnos = require('../controllers/turnos.controller');

const router = Router();

router.use(authenticate);

router.get('/', turnos.list);
router.post(
  '/',
  [
    body('turno').notEmpty().withMessage('Turno e obrigatorio'),
    body('resumo').notEmpty().withMessage('Resumo e obrigatorio'),
    body('pendencias').optional().isString(),
    body('orientacoes').optional().isString(),
  ],
  validate,
  turnos.create
);
router.put(
  '/:id',
  [
    body('turno').notEmpty().withMessage('Turno e obrigatorio'),
    body('resumo').notEmpty().withMessage('Resumo e obrigatorio'),
    body('pendencias').optional().isString(),
    body('orientacoes').optional().isString(),
  ],
  validate,
  turnos.update
);
router.delete('/:id', turnos.remove);

module.exports = router;
