const { z } = require('zod');
const prisma = require('../../utils/prisma');

const vendedorSchema = z.object({
  nombre: z.string().min(1),
  comisionPct: z.number().min(0).max(100).default(0),
  telefono: z.string().optional().nullable(),
});

async function listar(req, res) {
  const { comercioId } = req.user;
  const vendedores = await prisma.vendedor.findMany({
    where: { comercioId, activo: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(vendedores);
}

async function crear(req, res) {
  const { comercioId } = req.user;
  const parsed = vendedorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const vendedor = await prisma.vendedor.create({ data: { ...parsed.data, comercioId } });
  res.status(201).json(vendedor);
}

async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = vendedorSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.vendedor.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Vendedor no encontrado.' });

  const vendedor = await prisma.vendedor.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(vendedor);
}

async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.vendedor.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Vendedor no encontrado.' });

  await prisma.vendedor.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

/** Ranking de ventas y comisión generada por vendedor, en un rango de fechas. */
async function comisiones(req, res) {
  const { comercioId } = req.user;
  const { desde, hasta } = req.query;
  const filtroFecha = {};
  if (desde) filtroFecha.gte = new Date(desde);
  if (hasta) filtroFecha.lte = new Date(hasta);

  const ventas = await prisma.venta.findMany({
    where: { comercioId, vendedorId: { not: null }, ...(Object.keys(filtroFecha).length ? { fecha: filtroFecha } : {}) },
    include: { vendedor: true },
  });

  const agrupado = {};
  for (const v of ventas) {
    const key = v.vendedorId;
    if (!agrupado[key]) {
      agrupado[key] = { vendedorId: key, nombre: v.vendedor.nombre, cantidadVentas: 0, totalVendido: 0, comision: 0 };
    }
    agrupado[key].cantidadVentas += 1;
    agrupado[key].totalVendido += Number(v.total);
    agrupado[key].comision += Number(v.total) * (Number(v.vendedor.comisionPct) / 100);
  }

  res.json(Object.values(agrupado).map((r) => ({ ...r, totalVendido: round2(r.totalVendido), comision: round2(r.comision) })));
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { listar, crear, actualizar, eliminar, comisiones };
