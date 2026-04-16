const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const {
  login,
  refresh,
  logout,
  loginWithGoogle,
  loginWithFacebook,
  oauthConfig,
} = require('../controllers/auth.controller');

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
router.get('/oauth/config', oauthConfig);

router.post(
  '/oauth/google',
  [
    body().custom((value) => {
      if (!value?.idToken && !value?.accessToken) {
        throw new Error('idToken ou accessToken é obrigatório');
      }
      return true;
    }),
  ],
  validate,
  loginWithGoogle
);

router.post(
  '/oauth/facebook',
  [body('accessToken').notEmpty().withMessage('accessToken é obrigatório')],
  validate,
  loginWithFacebook
);

module.exports = router;
