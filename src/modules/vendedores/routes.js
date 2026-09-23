const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('vendedores:leer'), ctrl.listar);
router.get('/comisiones', requirePermiso('vendedores:leer'), ctrl.comisiones);
router.post('/', requirePermiso('vendedores:crear'), ctrl.crear);
router.put('/:id', requirePermiso('vendedores:editar'), ctrl.actualizar);
router.delete('/:id', requirePermiso('vendedores:eliminar'), ctrl.eliminar);

module.exports = router;
