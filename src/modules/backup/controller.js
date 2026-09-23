const { z } = require('zod');
const prisma = require('../../utils/prisma');

/**
 * Exporta TODO lo que tiene cargado el comercio como un único JSON.
 * Pensado para guardarlo aparte (Drive, USB, lo que sea) como respaldo
 * manual, independiente del backup automático del hosting.
 */
async function exportar(req, res) {
  const { comercioId } = req.user;

  const [
    productos, clientes, proveedores, vendedores,
    ventas, presupuestos, remitos, pedidos, gastos,
    movimientosStock, movimientosCaja, sesionesCaja,
  ] = await Promise.all([
    prisma.producto.findMany({ where: { comercioId } }),
    prisma.cliente.findMany({ where: { comercioId } }),
    prisma.proveedor.findMany({ where: { comercioId } }),
    prisma.vendedor.findMany({ where: { comercioId } }),
    prisma.venta.findMany({ where: { comercioId }, include: { items: true } }),
    prisma.presupuesto.findMany({ where: { comercioId }, include: { items: true } }),
    prisma.remito.findMany({ where: { comercioId }, include: { items: true } }),
    prisma.pedido.findMany({ where: { comercioId }, include: { items: true } }),
    prisma.gasto.findMany({ where: { comercioId } }),
    prisma.movimientoStock.findMany({ where: { comercioId } }),
    prisma.movimientoCaja.findMany({ where: { comercioId } }),
    prisma.sesionCaja.findMany({ where: { comercioId } }),
  ]);

  res.json({
    version: 1,
    exportadoEn: new Date().toISOString(),
    comercioId,
    productos, clientes, proveedores, vendedores,
    ventas, presupuestos, remitos, pedidos, gastos,
    movimientosStock, movimientosCaja, sesionesCaja,
  });
}

const backupSchema = z.object({
  version: z.number(),
  productos: z.array(z.any()).default([]),
  clientes: z.array(z.any()).default([]),
  proveedores: z.array(z.any()).default([]),
  vendedores: z.array(z.any()).default([]),
  gastos: z.array(z.any()).default([]),
  // ventas/presupuestos/remitos/pedidos e historial de movimientos NO se
  // reimportan: son transacciones ya ocurridas, reinsertarlas duplicaría
  // números de comprobante y descuadraría el stock. El respaldo sirve para
  // recuperar el catálogo (productos, clientes, proveedores, vendedores),
  // no para rebobinar el historial de operaciones.
});

/**
 * Restaura productos, clientes, proveedores y vendedores desde un backup.
 * SIEMPRE agrega como registros nuevos (nunca pisa ni borra lo existente),
 * para que nunca sea posible perder datos actuales por una importación.
 */
async function importar(req, res) {
  const { comercioId } = req.user;
  const parsed = backupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'El archivo no tiene el formato esperado de un backup de Stockeado.' });

  const { productos, clientes, proveedores, vendedores, gastos } = parsed.data;

  const limpiar = (arr, campos) => arr.map((r) => Object.fromEntries(campos.filter((c) => r[c] !== undefined).map((c) => [c, r[c]])));

  const resultado = await prisma.$transaction(async (tx) => {
    const p = productos.length
      ? await tx.producto.createMany({
          data: limpiar(productos, ['sku', 'nombre', 'categoria', 'precio', 'costo', 'stock', 'stockMinimo', 'ivaAlicuota']).map((r) => ({ ...r, comercioId })),
        })
      : { count: 0 };
    const c = clientes.length
      ? await tx.cliente.createMany({
          data: limpiar(clientes, ['nombre', 'cuitDni', 'condicionFiscal', 'email', 'telefono', 'direccion']).map((r) => ({ ...r, comercioId })),
        })
      : { count: 0 };
    const pr = proveedores.length
      ? await tx.proveedor.createMany({
          data: limpiar(proveedores, ['nombre', 'cuit', 'email', 'telefono', 'direccion', 'rubro']).map((r) => ({ ...r, comercioId })),
        })
      : { count: 0 };
    const v = vendedores.length
      ? await tx.vendedor.createMany({
          data: limpiar(vendedores, ['nombre', 'comisionPct', 'telefono']).map((r) => ({ ...r, comercioId })),
        })
      : { count: 0 };
    const g = gastos.length
      ? await tx.gasto.createMany({
          data: limpiar(gastos, ['concepto', 'categoria', 'monto']).map((r) => ({ ...r, comercioId })),
        })
      : { count: 0 };

    return { productos: p.count, clientes: c.count, proveedores: pr.count, vendedores: v.count, gastos: g.count };
  });

  res.json({ mensaje: 'Importación completada — se agregaron como registros nuevos.', creados: resultado });
}

module.exports = { exportar, importar };
