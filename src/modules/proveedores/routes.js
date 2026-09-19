const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('proveedores:leer'), ctrl.listar);
router.post('/', requirePermiso('proveedores:crear'), ctrl.crear);
router.put('/:id', requirePermiso('proveedores:editar'), ctrl.actualizar);
router.delete('/:id', requirePermiso('proveedores:eliminar'), ctrl.eliminar);

module.exports = router;
