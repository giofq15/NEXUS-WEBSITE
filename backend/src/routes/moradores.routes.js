const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/moradores.controller');

const router = Router();

router.use(authenticate);

router.get('/', authorizeAdmin, list);
router.get('/:id', getById);

router.post(
  '/',
  authorizeAdmin,
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    body('bloco').notEmpty().withMessage('Bloco é obrigatório'),
    body('unidade').notEmpty().withMessage('Unidade é obrigatória'),
  ],
  validate,
  create
);

router.put('/:id', update);
router.delete('/:id', authorizeAdmin, remove);

module.exports = router;
