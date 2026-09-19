// ============================================================
// FEATURE FLAGS
// ============================================================
// Prendés/apagás funcionalidad entera sin borrar código.
// Sirve para vender "básico" vs "pro" al mismo comercio, o para
// activar algo recién cuando esté probado (ej: facturacionArca).
// Un Comercio tiene un campo `plan`; acá se define qué desbloquea
// cada plan. Para agregar un plan nuevo, agregás una clave acá.
// ============================================================

const PLANES = {
  basico: {
    facturacionArca: false,   // false = comprobante interno. true = emite con CAE real (fase 5)
    multiSucursal: false,
    modoOffline: false,
    exportContable: false,
    limiteUsuarios: 3,
    limiteProductos: 500,
  },

  pro: {
    facturacionArca: true,
    multiSucursal: true,
    modoOffline: false, // todavía no implementado en ningún plan, se activa cuando esté listo
    exportContable: true,
    limiteUsuarios: 20,
    limiteProductos: null, // sin límite
  },
};

function featuresDe(plan) {
  return PLANES[plan] || PLANES.basico;
}

function tieneFeature(plan, feature) {
  const f = featuresDe(plan);
  return !!f[feature];
}

module.exports = { PLANES, featuresDe, tieneFeature };
