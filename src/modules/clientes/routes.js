const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('clientes:leer'), ctrl.listar);
router.post('/', requirePermiso('clientes:crear'), ctrl.crear);
router.put('/:id', requirePermiso('clientes:editar'), ctrl.actualizar);
router.delete('/:id', requirePermiso('clientes:eliminar'), ctrl.eliminar);

module.exports = router;
