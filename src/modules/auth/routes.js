const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ctrl = require('./controller');

// Límite estricto contra fuerza bruta de contraseñas — el rate limit
// general (server.js) es demasiado laxo para proteger un login.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Alta de un comercio nuevo (lo usás vos cuando vendés a un cliente nuevo)
router.post('/registrar-comercio', ctrl.registrarComercio);

// Login de un usuario dentro de un comercio
router.post('/login', limiteLogin, ctrl.login);

module.exports = router;
