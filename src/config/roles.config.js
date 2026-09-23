// ============================================================
// ROLES Y PERMISOS
// ============================================================
// Para agregar un rol nuevo: copiá un bloque, cambiá el nombre
// y los permisos. No hace falta tocar ningún controller.
// Los permisos son strings "modulo:accion". El middleware
// (src/middleware/permissions.js) los valida automáticamente.
// "*" = todos los módulos / todas las acciones.
// ============================================================

const ROLES = {
  admin: {
    label: 'Administrador',
    permisos: ['*:*'], // acceso total
  },

  operador: {
    label: 'Operador',
    permisos: [
      'pos:*',
      'facturacion:*',
      'clientes:*',
      'inventario:leer',
      'caja:*',
      'reportes:leer',
      'presupuestos:*',
      'remitos:*',
      'pedidos:*',
      'vendedores:leer',
    ],
  },

  cajero: {
    label: 'Cajero',
    permisos: [
      'pos:crear',
      'pos:leer',
      'caja:*',
      'clientes:leer',
      'clientes:crear',
      'inventario:leer',
    ],
  },

  deposito: {
    label: 'Encargado de Depósito',
    permisos: [
      'inventario:*',
      'proveedores:*',
      'pedidos:*',
      'remitos:*',
      'gastos:leer',
      'pedidos:*',
    ],
  },
};

function tienePermiso(rol, permisoRequerido) {
  const def = ROLES[rol];
  if (!def) return false;
  const [moduloReq, accionReq] = permisoRequerido.split(':');
  return def.permisos.some((p) => {
    const [modulo, accion] = p.split(':');
    const moduloOk = modulo === '*' || modulo === moduloReq;
    const accionOk = accion === '*' || accion === accionReq;
    return moduloOk && accionOk;
  });
}

module.exports = { ROLES, tienePermiso };
