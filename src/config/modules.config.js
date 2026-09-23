// ============================================================
// REGISTRO DE MÓDULOS
// ============================================================
// Cada módulo (carpeta en src/modules/) se registra acá con su
// ruta base y, opcionalmente, la feature flag que lo activa.
// server.js lee esta lista y monta las rutas automáticamente —
// para agregar un módulo nuevo NO tocás server.js, solo:
//   1. Copiás src/modules/_template/ con el nombre nuevo
//   2. Agregás una línea acá abajo
// Ver CONTRIBUTING.md → "Agregar un módulo nuevo".
// ============================================================

const modules = [
  { nombre: 'auth', basePath: '/api/auth', router: require('../modules/auth/routes'), publico: true },
  { nombre: 'productos', basePath: '/api/productos', router: require('../modules/productos/routes'), feature: null },
  { nombre: 'stock', basePath: '/api/stock', router: require('../modules/stock/routes'), feature: null },
  { nombre: 'clientes', basePath: '/api/clientes', router: require('../modules/clientes/routes'), feature: null },
  { nombre: 'ventas', basePath: '/api/ventas', router: require('../modules/ventas/routes'), feature: null },
  { nombre: 'caja', basePath: '/api/caja', router: require('../modules/caja/routes'), feature: null },
  { nombre: 'presupuestos', basePath: '/api/presupuestos', router: require('../modules/presupuestos/routes'), feature: null },
  { nombre: 'remitos', basePath: '/api/remitos', router: require('../modules/remitos/routes'), feature: null },
  { nombre: 'proveedores', basePath: '/api/proveedores', router: require('../modules/proveedores/routes'), feature: null },
  { nombre: 'gastos', basePath: '/api/gastos', router: require('../modules/gastos/routes'), feature: null },
  { nombre: 'reportes', basePath: '/api/reportes', router: require('../modules/reportes/routes'), feature: null },
  { nombre: 'usuarios', basePath: '/api/usuarios', router: require('../modules/usuarios/routes'), feature: null },
  { nombre: 'vendedores', basePath: '/api/vendedores', router: require('../modules/vendedores/routes'), feature: null },
  { nombre: 'pedidos', basePath: '/api/pedidos', router: require('../modules/pedidos/routes'), feature: null },
  { nombre: 'configuracion', basePath: '/api/configuracion', router: require('../modules/configuracion/routes'), feature: null },
  { nombre: 'backup', basePath: '/api/backup', router: require('../modules/backup/routes'), feature: null },

  // Próximo módulo, siguiendo el mismo patrón:
  // { nombre: 'arca', basePath: '/api/arca', router: require('../modules/arca/routes'), feature: 'facturacionArca' }, // fase 5
];

module.exports = modules;
