const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('inventario:leer'), ctrl.listar);
router.get('/:id', requirePermiso('inventario:leer'), ctrl.obtener);
router.post('/', requirePermiso('inventario:crear'), ctrl.crear);
router.put('/:id', requirePermiso('inventario:editar'), ctrl.actualizar);
router.delete('/:id', requirePermiso('inventario:eliminar'), ctrl.eliminar);

module.exports = router;
