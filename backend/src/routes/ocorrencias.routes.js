const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const ocorrencias = require('../controllers/ocorrencias.controller');

const router = Router();

router.use(authenticate);

router.get('/', ocorrencias.list);
router.get('/:id', ocorrencias.getById);

router.post(
  '/',
  [
    body('tipo').notEmpty().withMessage('Tipo e obrigatorio'),
    body('local').notEmpty().withMessage('Local e obrigatorio'),
    body('descricao').notEmpty().withMessage('Descricao e obrigatoria'),
    body('prioridade').optional().isIn(['ALTA', 'MEDIA', 'BAIXA']).withMessage('Prioridade invalida'),
    body('status').optional().isIn(['EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA']).withMessage('Status invalido'),
    body('colaboradorId').optional().isInt({ min: 1 }).withMessage('colaboradorId invalido'),
    body('moradorId').optional().isInt({ min: 1 }).withMessage('moradorId invalido'),
  ],
  validate,
  ocorrencias.create
);

router.patch(
  '/:id/status',
  authorizeAdmin,
  [body('status').isIn(['EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA']).withMessage('Status invalido')],
  validate,
  ocorrencias.updateStatus
);

module.exports = router;
