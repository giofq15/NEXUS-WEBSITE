const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const areas = require('../controllers/areasLazer.controller');

const router = Router();

router.use(authenticate);

router.get('/', areas.list);
router.get('/:id', areas.getById);

router.post(
  '/',
  authorizeAdmin,
  [body('nome').notEmpty().withMessage('Nome e obrigatorio')],
  validate,
  areas.create
);

router.put('/:id', authorizeAdmin, areas.update);

module.exports = router;
