const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

router.get('/', requirePermiso('pedidos:leer'), ctrl.listar);
router.post('/', requirePermiso('pedidos:crear'), ctrl.crear);
router.put('/:id/estado', requirePermiso('pedidos:editar'), ctrl.actualizarEstado);

module.exports = router;
