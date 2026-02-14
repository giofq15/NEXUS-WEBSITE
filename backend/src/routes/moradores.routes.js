const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const moradores = require('../controllers/moradores.controller');

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// CRUD moradores
router.get('/', moradores.list);
router.get('/:id', moradores.getById);

router.post(
  '/',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    body('bloco').notEmpty().withMessage('Bloco é obrigatório'),
    body('unidade').notEmpty().withMessage('Apartamento é obrigatório'),
    body('tipoMoradia').optional().isIn(['PROPRIETARIO', 'ALUGUEL']).withMessage('Tipo de moradia inválido'),
    body('email').isEmail().withMessage('E-mail inválido'),
  ],
  validate,
  moradores.create
);

router.put(
  '/:id',
  [
    body('nome').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('E-mail inválido'),
  ],
  validate,
  moradores.update
);

router.delete('/:id', moradores.remove);

// Veículos
router.post(
  '/:id/veiculos',
  [
    body('placa').notEmpty().withMessage('Placa é obrigatória'),
    body('tipo').isIn(['CARRO', 'MOTO']).withMessage('Tipo deve ser CARRO ou MOTO'),
  ],
  validate,
  moradores.addVeiculo
);

router.delete('/:id/veiculos/:veiculoId', moradores.removeVeiculo);

module.exports = router;
