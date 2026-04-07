const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { login, refresh, logout } = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail invalido'),
    body('password').notEmpty().withMessage('Senha e obrigatoria'),
  ],
  validate,
  login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('refreshToken e obrigatorio')],
  validate,
  refresh
);

router.post('/logout', logout);

module.exports = router;
