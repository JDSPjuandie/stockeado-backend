const { z } = require('zod');
const prisma = require('../../utils/prisma');

const itemSchema = z.object({
  nombreProducto: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
});

const presupuestoSchema = z.object({
  clienteId: z.string().optional().nullable(),
  validoHasta: z.string().datetime().optional().nullable(),
  items: z.array(itemSchema).min(1, 'El presupuesto necesita al menos un ítem'),
});

async function crear(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = presupuestoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { clienteId, validoHasta, items } = parsed.data;

  const total = items.reduce((a, it) => a + it.cantidad * it.precioUnitario, 0);

  const ultimo = await prisma.presupuesto.findFirst({ where: { comercioId }, orderBy: { numero: 'desc' }, select: { numero: true } });
  const numero = (ultimo?.numero || 0) + 1;

  const presupuesto = await prisma.presupuesto.create({
    data: {
      comercioId,
      clienteId: clienteId || null,
      usuarioId,
      numero,
      subtotal: total,
      total,
      validoHasta: validoHasta ? new Date(validoHasta) : null,
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json(presupuesto);
}

async function listar(req, res) {
  const { comercioId } = req.user;
  const presupuestos = await prisma.presupuesto.findMany({
    where: { comercioId },
    include: { items: true, cliente: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 200,
  });
  res.json(presupuestos);
}

async function actualizarEstado(req, res) {
  const { comercioId } = req.user;
  const schema = z.object({ estado: z.enum(['pendiente', 'aceptado', 'rechazado', 'vencido']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Estado inválido.' });

  const existente = await prisma.presupuesto.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Presupuesto no encontrado.' });

  const presupuesto = await prisma.presupuesto.update({ where: { id: req.params.id }, data: { estado: parsed.data.estado } });
  res.json(presupuesto);
}

/**
 * Convierte un presupuesto aceptado en una venta real — reutiliza la
 * misma lógica de creación de venta (stock, IVA), así que un presupuesto
 * nunca puede "saltearse" las validaciones de stock que sí tiene una venta.
 */
async function convertirAVenta(req, res) {
  const { comercioId } = req.user;
  const presupuesto = await prisma.presupuesto.findFirst({
    where: { id: req.params.id, comercioId },
    include: { items: true },
  });
  if (!presupuesto) return res.status(404).json({ error: 'Presupuesto no encontrado.' });

  res.status(200).json({
    mensaje: 'Usá estos datos para crear la venta en POST /api/ventas — el presupuesto en sí no descuenta stock.',
    borradorVenta: {
      clienteId: presupuesto.clienteId,
      condicionFiscal: 'Consumidor Final',
      items: presupuesto.items.map((it) => ({
        nombreProducto: it.nombreProducto,
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
        descuentoPct: 0,
        ivaAlicuota: 21,
      })),
    },
  });
}

module.exports = { crear, listar, actualizarEstado, convertirAVenta };
