const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { requireAuth } = require('../../middleware/auth');
const { requirePermiso } = require('../../middleware/permissions');

router.use(requireAuth);

// Cambiá '<modulo>' por el nombre real (ej: 'proveedores') y asegurate
// de que ese nombre exista en roles.config.js dentro de los permisos de cada rol.
router.get('/', requirePermiso('<modulo>:leer'), ctrl.listar);
router.post('/', requirePermiso('<modulo>:crear'), ctrl.crear);
router.put('/:id', requirePermiso('<modulo>:editar'), ctrl.actualizar);
router.delete('/:id', requirePermiso('<modulo>:eliminar'), ctrl.eliminar);

module.exports = router;
