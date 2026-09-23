const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('presupuestos:leer'), ctrl.listar);
router.post('/', requirePermiso('presupuestos:crear'), ctrl.crear);
router.put('/:id/estado', requirePermiso('presupuestos:editar'), ctrl.actualizarEstado);
router.post('/:id/convertir', requirePermiso('presupuestos:editar'), ctrl.convertirAVenta);

module.exports = router;
