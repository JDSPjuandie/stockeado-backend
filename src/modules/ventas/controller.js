const { z } = require('zod');
const prisma = require('../../utils/prisma');
const { calcularIVA } = require('../../utils/iva');

const itemSchema = z.object({
  productoId: z.string().optional().nullable(), // opcional: permite vender un ítem "suelto" sin producto cargado
  nombreProducto: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  descuentoPct: z.number().min(0).max(100).default(0),
  ivaAlicuota: z.number().default(21),
});

const ventaSchema = z.object({
  clienteId: z.string().optional().nullable(),
  vendedorId: z.string().optional().nullable(),
  condicionFiscal: z.string().default('Consumidor Final'),
  items: z.array(itemSchema).min(1, 'La venta necesita al menos un ítem'),
});

/**
 * Crea una venta completa: valida stock, descuenta stock, registra
 * movimientos y calcula IVA — todo en una sola transacción de base
 * de datos. Si algo falla a mitad de camino, se deshace todo (no
 * queda una venta fantasma ni stock descontado sin venta asociada).
 */
async function crear(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = ventaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const { clienteId, vendedorId, condicionFiscal, items } = parsed.data;

  try {
    const venta = await prisma.$transaction(async (tx) => {
      // 1. Validar stock de todos los productos con ID antes de tocar nada
      for (const it of items) {
        if (!it.productoId) continue;
        const producto = await tx.producto.findFirst({ where: { id: it.productoId, comercioId } });
        if (!producto) throw new Error(`Producto no encontrado: ${it.nombreProducto}`);
        if (Number(producto.stock) < it.cantidad) {
          throw new Error(`Stock insuficiente de "${producto.nombre}". Disponible: ${producto.stock}.`);
        }
      }

      // 2. Calcular totales fiscales en el servidor (nunca confiar en totales del cliente)
      const totales = calcularIVA(items, condicionFiscal);

      // 3. Número de comprobante correlativo por comercio
      const ultima = await tx.venta.findFirst({
        where: { comercioId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const numero = (ultima?.numero || 0) + 1;

      // 4. Crear la venta + items
      const nuevaVenta = await tx.venta.create({
        data: {
          comercioId,
          clienteId: clienteId || null,
          vendedorId: vendedorId || null,
          usuarioId,
          numero,
          condicionFiscal,
          tipoComprobante: 'Comprobante Interno', // cambia a "Factura A/B/C" cuando el módulo ARCA (fase 5) esté activo
          estadoFiscal: 'interno',
          subtotal: totales.subtotal,
          iva21: totales.iva21,
          iva105: totales.iva105,
          iva27: totales.iva27,
          total: totales.total,
          items: {
            create: items.map((it) => ({
              productoId: it.productoId || null,
              nombreProducto: it.nombreProducto,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              descuentoPct: it.descuentoPct,
              ivaAlicuota: it.ivaAlicuota,
            })),
          },
        },
        include: { items: true },
      });

      // 5. Descontar stock + registrar movimiento, solo para ítems con producto real
      for (const it of items) {
        if (!it.productoId) continue;
        await tx.producto.update({
          where: { id: it.productoId },
          data: { stock: { decrement: it.cantidad } },
        });
        await tx.movimientoStock.create({
          data: {
            comercioId,
            productoId: it.productoId,
            tipo: 'venta',
            cantidad: -Math.abs(it.cantidad),
            motivo: `Venta N° ${numero}`,
            usuarioId,
          },
        });
      }

      return nuevaVenta;
    });

    res.status(201).json(venta);
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo registrar la venta.' });
  }
}

async function listar(req, res) {
  const { comercioId } = req.user;
  const { desde, hasta, clienteId } = req.query;

  const ventas = await prisma.venta.findMany({
    where: {
      comercioId,
      ...(clienteId ? { clienteId } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
    },
    include: { items: true, cliente: { select: { nombre: true } }, vendedor: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' },
    take: 300,
  });

  res.json(ventas);
}

async function obtener(req, res) {
  const { comercioId } = req.user;
  const venta = await prisma.venta.findFirst({
    where: { id: req.params.id, comercioId },
    include: { items: true, cliente: true, vendedor: true },
  });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });
  res.json(venta);
}

module.exports = { crear, listar, obtener };
