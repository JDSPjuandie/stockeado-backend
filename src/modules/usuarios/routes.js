const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

// Gestionar usuarios es cosa de administradores — no se abre por roles.config
// genérico porque tocar cuentas de otra gente es más sensible que el resto.
router.get('/', requirePermiso('usuarios:leer'), ctrl.listar);
router.post('/', requirePermiso('usuarios:crear'), ctrl.crear);
router.put('/:id', requirePermiso('usuarios:editar'), ctrl.actualizar);

module.exports = router;
