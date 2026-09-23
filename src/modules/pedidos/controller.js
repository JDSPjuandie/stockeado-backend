const { z } = require('zod');
const prisma = require('../../utils/prisma');

const itemSchema = z.object({
  nombreProducto: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
});

const pedidoSchema = z.object({
  clienteId: z.string().optional().nullable(),
  fechaEntrega: z.string().datetime().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'El pedido necesita al menos un ítem'),
});

async function crear(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = pedidoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { clienteId, fechaEntrega, observaciones, items } = parsed.data;

  const total = items.reduce((a, it) => a + it.cantidad * it.precioUnitario, 0);
  const ultimo = await prisma.pedido.findFirst({ where: { comercioId }, orderBy: { numero: 'desc' }, select: { numero: true } });
  const numero = (ultimo?.numero || 0) + 1;

  const pedido = await prisma.pedido.create({
    data: {
      comercioId, clienteId: clienteId || null, usuarioId, numero, total, observaciones,
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json(pedido);
}

async function listar(req, res) {
  const { comercioId } = req.user;
  const { estado } = req.query;
  const pedidos = await prisma.pedido.findMany({
    where: { comercioId, ...(estado ? { estado } : {}) },
    include: { items: true, cliente: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 200,
  });
  res.json(pedidos);
}

const ESTADOS = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];

async function actualizarEstado(req, res) {
  const { comercioId } = req.user;
  const schema = z.object({ estado: z.enum(ESTADOS) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Estado inválido.' });

  const existente = await prisma.pedido.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Pedido no encontrado.' });

  const pedido = await prisma.pedido.update({ where: { id: req.params.id }, data: { estado: parsed.data.estado } });
  res.json(pedido);
}

module.exports = { crear, listar, actualizarEstado };
