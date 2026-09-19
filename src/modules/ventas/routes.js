const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('pos:leer'), ctrl.listar);
router.get('/:id', requirePermiso('pos:leer'), ctrl.obtener);
router.post('/', requirePermiso('pos:crear'), ctrl.crear);

module.exports = router;
