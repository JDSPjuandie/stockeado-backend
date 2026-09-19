const { z } = require('zod');
const prisma = require('../../utils/prisma');

const gastoSchema = z.object({
  concepto: z.string().min(1),
  categoria: z.string().optional().nullable(),
  monto: z.number().positive(),
  proveedorId: z.string().optional().nullable(),
  fecha: z.string().datetime().optional(), // ISO — si no viene, usa la fecha actual (default de la base)
});

async function listar(req, res) {
  const { comercioId } = req.user;
  const { desde, hasta, categoria } = req.query;

  const gastos = await prisma.gasto.findMany({
    where: {
      comercioId,
      ...(categoria ? { categoria } : {}),
      ...(desde || hasta
        ? { fecha: { ...(desde ? { gte: new Date(desde) } : {}), ...(hasta ? { lte: new Date(hasta) } : {}) } }
        : {}),
    },
    include: { proveedor: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 300,
  });

  res.json(gastos);
}

async function crear(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = gastoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { fecha, ...resto } = parsed.data;
  const gasto = await prisma.gasto.create({
    data: { ...resto, comercioId, usuarioId, ...(fecha ? { fecha: new Date(fecha) } : {}) },
  });
  res.status(201).json(gasto);
}

async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.gasto.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Gasto no encontrado.' });

  await prisma.gasto.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

module.exports = { listar, crear, eliminar };
