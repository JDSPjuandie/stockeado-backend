const { z } = require('zod');
const prisma = require('../../utils/prisma');

const itemSchema = z.object({
  productoId: z.string().optional().nullable(),
  nombreProducto: z.string().min(1),
  cantidad: z.number().positive(),
});

const remitoSchema = z.object({
  clienteId: z.string().optional().nullable(),
  tipo: z.enum(['entrega', 'devolucion']).default('entrega'),
  observaciones: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'El remito necesita al menos un ítem'),
});

/**
 * Un remito de "entrega" descuenta stock (salió mercadería del depósito,
 * sin necesariamente cobrarse todavía — ej: entrega contra factura
 * posterior). Uno de "devolucion" lo suma. Misma lógica atómica que ventas.
 */
async function crear(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = remitoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { clienteId, tipo, observaciones, items } = parsed.data;

  try {
    const remito = await prisma.$transaction(async (tx) => {
      for (const it of items) {
        if (!it.productoId || tipo !== 'entrega') continue;
        const producto = await tx.producto.findFirst({ where: { id: it.productoId, comercioId } });
        if (!producto) throw new Error(`Producto no encontrado: ${it.nombreProducto}`);
        if (Number(producto.stock) < it.cantidad) {
          throw new Error(`Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock}.`);
        }
      }

      const ultimo = await tx.remito.findFirst({ where: { comercioId }, orderBy: { numero: 'desc' }, select: { numero: true } });
      const numero = (ultimo?.numero || 0) + 1;

      const nuevoRemito = await tx.remito.create({
        data: {
          comercioId, clienteId: clienteId || null, usuarioId, numero, tipo, observaciones,
          items: { create: items },
        },
        include: { items: true },
      });

      for (const it of items) {
        if (!it.productoId) continue;
        const delta = tipo === 'entrega' ? -Math.abs(it.cantidad) : Math.abs(it.cantidad);
        await tx.producto.update({ where: { id: it.productoId }, data: { stock: { increment: delta } } });
        await tx.movimientoStock.create({
          data: {
            comercioId, productoId: it.productoId,
            tipo: tipo === 'entrega' ? 'salida' : 'entrada',
            cantidad: delta,
            motivo: `Remito N° ${numero}`,
            usuarioId,
          },
        });
      }

      return nuevoRemito;
    });

    res.status(201).json(remito);
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo registrar el remito.' });
  }
}

async function listar(req, res) {
  const { comercioId } = req.user;
  const remitos = await prisma.remito.findMany({
    where: { comercioId },
    include: { items: true, cliente: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 200,
  });
  res.json(remitos);
}

module.exports = { crear, listar };
