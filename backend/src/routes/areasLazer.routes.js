const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { list, getById, create, update, remove } = require('../controllers/areasLazer.controller');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', getById);

router.post(
  '/',
  authorizeAdmin,
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('capacidade').isInt({ min: 1 }).withMessage('Capacidade deve ser um número positivo'),
  ],
  validate,
  create
);

router.put('/:id', authorizeAdmin, update);
router.delete('/:id', authorizeAdmin, remove);

module.exports = router;
