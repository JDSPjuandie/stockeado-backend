// ============================================================
// CAMPOS PERSONALIZADOS (custom fields)
// ============================================================
// Estos campos se guardan en la columna `camposExtra` (JSON) de
// cada entidad, sin tocar la base de datos. Para agregar un
// campo nuevo a Producto, Cliente, etc: agregalo acá abajo y
// listo — aparece en la validación y (cuando conectemos el
// frontend) en el formulario automáticamente.
//
// tipo: "texto" | "numero" | "booleano" | "select" | "fecha"
// ============================================================

const CAMPOS_PERSONALIZADOS = {
  producto: [
    // Ejemplo — descomentar y adaptar:
    // { key: 'talle', label: 'Talle', tipo: 'select', opciones: ['S','M','L','XL'], requerido: false },
    // { key: 'color', label: 'Color', tipo: 'texto', requerido: false },
    // { key: 'vencimiento', label: 'Fecha de vencimiento', tipo: 'fecha', requerido: false },
  ],
  cliente: [
    // { key: 'zona', label: 'Zona de reparto', tipo: 'texto', requerido: false },
  ],
};

/** Valida que camposExtra recibido cumpla con los campos requeridos definidos arriba. */
function validarCamposExtra(entidad, data = {}) {
  const defs = CAMPOS_PERSONALIZADOS[entidad] || [];
  const errores = [];
  for (const def of defs) {
    const val = data[def.key];
    if (def.requerido && (val === undefined || val === null || val === '')) {
      errores.push(`El campo "${def.label}" es requerido`);
    }
    if (def.tipo === 'select' && val !== undefined && !def.opciones.includes(val)) {
      errores.push(`El campo "${def.label}" debe ser uno de: ${def.opciones.join(', ')}`);
    }
  }
  return errores;
}

module.exports = { CAMPOS_PERSONALIZADOS, validarCamposExtra };
