const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/sesion-activa', requirePermiso('caja:leer'), ctrl.sesionActiva);
router.post('/abrir', requirePermiso('caja:crear'), ctrl.abrir);
router.post('/cerrar', requirePermiso('caja:editar'), ctrl.cerrar);
router.post('/movimiento', requirePermiso('caja:crear'), ctrl.registrarMovimiento);
router.get('/movimientos', requirePermiso('caja:leer'), ctrl.movimientosDeSesion);

module.exports = router;
