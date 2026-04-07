const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const moradores = require('../controllers/moradores.controller');

const router = Router();

router.use(authenticate);

// Rota do próprio morador (sem admin)
router.get('/me', moradores.me);

// Rotas admin
router.get('/', authorizeAdmin, moradores.list);
router.get('/:id', moradores.getById);

router.post(
  '/',
  authorizeAdmin,
  [
    body('nome').notEmpty().withMessage('Nome e obrigatorio'),
    body('cpf').notEmpty().withMessage('CPF e obrigatorio'),
    body('telefone').notEmpty().withMessage('Telefone e obrigatorio'),
    body('bloco').notEmpty().withMessage('Bloco e obrigatorio'),
    body('unidade').notEmpty().withMessage('Unidade e obrigatoria'),
    body('email').isEmail().withMessage('E-mail invalido'),
  ],
  validate,
  moradores.create
);

router.put(
  '/:id',
  authorizeAdmin,
  [
    body('nome').optional().notEmpty().withMessage('Nome nao pode ser vazio'),
    body('email').optional().isEmail().withMessage('E-mail invalido'),
  ],
  validate,
  moradores.update
);

router.delete('/:id', authorizeAdmin, moradores.remove);

module.exports = router;
