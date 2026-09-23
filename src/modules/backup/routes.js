const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/exportar', requirePermiso('backup:leer'), ctrl.exportar);
router.post('/importar', requirePermiso('backup:crear'), ctrl.importar);

module.exports = router;
