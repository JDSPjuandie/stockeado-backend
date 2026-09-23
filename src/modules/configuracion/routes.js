const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('configuracion:leer'), ctrl.obtener);
router.put('/', requirePermiso('configuracion:editar'), ctrl.actualizar);

module.exports = router;
