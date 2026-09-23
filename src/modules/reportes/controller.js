const prisma = require('../../utils/prisma');

function rangoFechas(query) {
  const { desde, hasta } = query;
  const filtro = {};
  if (desde) filtro.gte = new Date(desde);
  if (hasta) filtro.lte = new Date(hasta);
  return Object.keys(filtro).length ? filtro : undefined;
}

async function resumen(req, res) {
  const { comercioId } = req.user;
  const fecha = rangoFechas(req.query);

  const [ventas, gastos] = await Promise.all([
    prisma.venta.findMany({ where: { comercioId, ...(fecha ? { fecha } : {}) } }),
    prisma.gasto.findMany({ where: { comercioId, ...(fecha ? { fecha } : {}) } }),
  ]);

  const totalVentas = ventas.reduce((a, v) => a + Number(v.total), 0);
  const totalGastos = gastos.reduce((a, g) => a + Number(g.monto), 0);

  res.json({
    cantidadVentas: ventas.length,
    totalVentas: round2(totalVentas),
    ticketPromedio: ventas.length ? round2(totalVentas / ventas.length) : 0,
    totalGastos: round2(totalGastos),
    resultado: round2(totalVentas - totalGastos),
  });
}

/** Desglose de IVA para liquidación — lo que necesitás pasarle a tu contador. */
async function iva(req, res) {
  const { comercioId } = req.user;
  const fecha = rangoFechas(req.query);

  const ventas = await prisma.venta.findMany({ where: { comercioId, ...(fecha ? { fecha } : {}) } });

  const totales = ventas.reduce(
    (a, v) => ({
      subtotal: a.subtotal + Number(v.subtotal),
      iva21: a.iva21 + Number(v.iva21),
      iva105: a.iva105 + Number(v.iva105),
      iva27: a.iva27 + Number(v.iva27),
      total: a.total + Number(v.total),
    }),
    { subtotal: 0, iva21: 0, iva105: 0, iva27: 0, total: 0 }
  );

  res.json({
    cantidadComprobantes: ventas.length,
    ...Object.fromEntries(Object.entries(totales).map(([k, v]) => [k, round2(v)])),
    ivaTotal: round2(totales.iva21 + totales.iva105 + totales.iva27),
  });
}

/** Productos más vendidos por cantidad, en el rango de fechas. */
async function productosTop(req, res) {
  const { comercioId } = req.user;
  const fecha = rangoFechas(req.query);

  const items = await prisma.ventaItem.findMany({
    where: { venta: { comercioId, ...(fecha ? { fecha } : {}) } },
  });

  const agrupado = {};
  for (const it of items) {
    const key = it.nombreProducto;
    if (!agrupado[key]) agrupado[key] = { nombreProducto: key, cantidad: 0, total: 0 };
    agrupado[key].cantidad += Number(it.cantidad);
    agrupado[key].total += Number(it.cantidad) * Number(it.precioUnitario) * (1 - Number(it.descuentoPct) / 100);
  }

  const ranking = Object.values(agrupado)
    .map((r) => ({ ...r, total: round2(r.total) }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 20);

  res.json(ranking);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { resumen, iva, productosTop };
