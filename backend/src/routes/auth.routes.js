const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { login, requestCadastro } = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  validate,
  login
);


router.post(
  '/request-cadastro',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    body('bloco').notEmpty().withMessage('Bloco é obrigatório'),
    body('unidade').notEmpty().withMessage('Unidade é obrigatória'),
    body('email').isEmail().withMessage('E-mail inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  ],
  validate,
  requestCadastro
);

module.exports = router;
