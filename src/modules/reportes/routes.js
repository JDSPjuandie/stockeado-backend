const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/resumen', requirePermiso('reportes:leer'), ctrl.resumen);
router.get('/iva', requirePermiso('reportes:leer'), ctrl.iva);
router.get('/productos-top', requirePermiso('reportes:leer'), ctrl.productosTop);

module.exports = router;
