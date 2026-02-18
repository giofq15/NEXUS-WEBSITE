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
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('local').notEmpty().withMessage('Local é obrigatório'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('prioridade').optional().isIn(['ALTA', 'MEDIA', 'BAIXA']).withMessage('Prioridade inválida'),
    body('status').optional().isIn(['EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA']).withMessage('Status inválido'),
    body('moradorId').optional().isInt({ min: 1 }).withMessage('moradorId inválido'),
  ],
  validate,
  ocorrencias.create
);

router.patch(
  '/:id/status',
  authorizeAdmin,
  [body('status').isIn(['EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA']).withMessage('Status inválido')],
  validate,
  ocorrencias.updateStatus
);

module.exports = router;
