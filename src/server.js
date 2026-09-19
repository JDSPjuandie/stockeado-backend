require('dotenv').config();
require('express-async-errors'); // permite que errores en controllers `async` lleguen al middleware de error de abajo
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const modules = require('./config/modules.config');

const app = express();

// En producción, restringí ALLOWED_ORIGINS a los dominios reales del
// frontend (separados por coma). Si no está seteada, permite todo —
// cómodo en desarrollo, pero seteala siempre antes de ir a producción.
const origenesPermitidos = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: origenesPermitidos && origenesPermitidos.length > 0 ? origenesPermitidos : true,
  })
);
app.use(express.json({ limit: '2mb' }));

// Rate limit general — protege contra fuerza bruta en login y abuso de API.
// Más estricto se puede poner específicamente en /api/auth/login si hace falta.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' },
  })
);

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'stockeado-backend' }));

// ------------------------------------------------------------
// Monta automáticamente cada módulo registrado en modules.config.js.
// Para agregar un módulo NUEVO no se toca este archivo — se agrega
// la línea en modules.config.js y listo.
// ------------------------------------------------------------
for (const mod of modules) {
  app.use(mod.basePath, mod.router);
  console.log(`✓ Módulo montado: ${mod.nombre} → ${mod.basePath}`);
}

// Manejo de errores no capturados — evita que el servidor se caiga
// entero por una excepción en un controller y devuelve un error prolijo.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Stockeado backend corriendo en el puerto ${PORT}\n`);
});
