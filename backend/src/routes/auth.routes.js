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
    body('portal').optional().isIn(['admin', 'colaborador']).withMessage('Portal invalido'),
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
    body('portal').optional().isIn(['admin', 'colaborador']).withMessage('Portal invalido'),
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
  [
    body('accessToken').notEmpty().withMessage('accessToken e obrigatorio'),
    body('portal').optional().isIn(['admin', 'colaborador']).withMessage('Portal invalido'),
  ],
  validate,
  loginWithFacebook
);

module.exports = router;
