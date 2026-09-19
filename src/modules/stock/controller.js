const { z } = require('zod');
const prisma = require('../../utils/prisma');

const movimientoSchema = z.object({
  productoId: z.string(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.number(), // en "ajuste" puede ser negativo; en entrada/salida siempre positivo
  motivo: z.string().optional(),
});

/**
 * Registra un movimiento de stock y actualiza el stock del producto
 * en una sola transacción — así nunca queda un movimiento registrado
 * sin reflejarse en el stock real, ni viceversa.
 */
async function registrarMovimiento(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = movimientoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { productoId, tipo, cantidad, motivo } = parsed.data;

  const producto = await prisma.producto.findFirst({ where: { id: productoId, comercioId } });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

  let delta;
  if (tipo === 'entrada') delta = Math.abs(cantidad);
  else if (tipo === 'salida') delta = -Math.abs(cantidad);
  else delta = cantidad; // ajuste: el signo que venga

  const nuevoStock = Number(producto.stock) + delta;
  if (nuevoStock < 0) {
    return res.status(400).json({ error: `Stock insuficiente. Stock actual: ${producto.stock}.` });
  }

  const [movimiento] = await prisma.$transaction([
    prisma.movimientoStock.create({
      data: { comercioId, productoId, tipo, cantidad: delta, motivo, usuarioId },
    }),
    prisma.producto.update({ where: { id: productoId }, data: { stock: nuevoStock } }),
  ]);

  res.status(201).json(movimiento);
}

async function historial(req, res) {
  const { comercioId } = req.user;
  const { productoId } = req.query;

  const movimientos = await prisma.movimientoStock.findMany({
    where: { comercioId, ...(productoId ? { productoId } : {}) },
    include: { producto: { select: { nombre: true, sku: true } } },
    orderBy: { fecha: 'desc' },
    take: 200,
  });

  res.json(movimientos);
}

async function bajoMinimo(req, res) {
  const { comercioId } = req.user;
  const productos = await prisma.producto.findMany({
    where: { comercioId, activo: true, stockMinimo: { not: null } },
  });
  const alerta = productos.filter((p) => Number(p.stock) <= Number(p.stockMinimo));
  res.json(alerta);
}

module.exports = { registrarMovimiento, historial, bajoMinimo };
