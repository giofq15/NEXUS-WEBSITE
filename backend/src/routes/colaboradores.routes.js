const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const colaboradores = require('../controllers/colaboradores.controller');

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', colaboradores.list);
router.get('/:id', colaboradores.getById);

router.post(
  '/',
  [
    body('nome').notEmpty().withMessage('Nome e obrigatorio'),
    body('cpf').notEmpty().withMessage('CPF e obrigatorio'),
    body('telefone').notEmpty().withMessage('Telefone e obrigatorio'),
    body('bloco').notEmpty().withMessage('Bloco e obrigatorio'),
    body('unidade').notEmpty().withMessage('Unidade e obrigatoria'),
    body('email').isEmail().withMessage('E-mail invalido'),
  ],
  validate,
  colaboradores.create
);

router.put(
  '/:id',
  [
    body('nome').optional().notEmpty().withMessage('Nome nao pode ser vazio'),
    body('email').optional().isEmail().withMessage('E-mail invalido'),
  ],
  validate,
  colaboradores.update
);

router.delete('/:id', colaboradores.remove);

router.post(
  '/:id/veiculos',
  [
    body('placa').notEmpty().withMessage('Placa e obrigatoria'),
    body('tipo').isIn(['CARRO', 'MOTO']).withMessage('Tipo deve ser CARRO ou MOTO'),
  ],
  validate,
  colaboradores.addVeiculo
);

router.delete('/:id/veiculos/:veiculoId', colaboradores.removeVeiculo);

module.exports = router;
