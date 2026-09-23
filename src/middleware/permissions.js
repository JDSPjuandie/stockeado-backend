const { tienePermiso } = require('../config/roles.config');
const { tieneFeature } = require('../config/features.config');

/**
 * Uso: router.post('/', requireAuth, requirePermiso('inventario:crear'), controller.crear)
 * Lee el rol de req.user (seteado por requireAuth) y lo valida
 * contra roles.config.js. Cero lógica de roles en los controllers.
 */
function requirePermiso(permiso) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
    if (!tienePermiso(req.user.rol, permiso)) {
      return res.status(403).json({ error: `No tenés permiso para: ${permiso}` });
    }
    next();
  };
}

/**
 * Uso: router.post('/', requireAuth, requireFeature('facturacionArca'), controller.emitir)
 * Bloquea el endpoint si el plan del comercio no incluye esa feature.
 */
function requireFeature(feature) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
    if (!tieneFeature(req.user.plan, feature)) {
      return res.status(402).json({ error: `Esta función (${feature}) no está incluida en tu plan.` });
    }
    next();
  };
}

module.exports = { requirePermiso, requireFeature };
