const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('gastos:leer'), ctrl.listar);
router.post('/', requirePermiso('gastos:crear'), ctrl.crear);
router.delete('/:id', requirePermiso('gastos:eliminar'), ctrl.eliminar);

module.exports = router;
