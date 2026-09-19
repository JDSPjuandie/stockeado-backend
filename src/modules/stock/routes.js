const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.post('/movimiento', requirePermiso('inventario:editar'), ctrl.registrarMovimiento);
router.get('/historial', requirePermiso('inventario:leer'), ctrl.historial);
router.get('/bajo-minimo', requirePermiso('inventario:leer'), ctrl.bajoMinimo);

module.exports = router;
