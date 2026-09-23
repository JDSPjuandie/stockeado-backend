const { z } = require('zod');
const prisma = require('../../utils/prisma');
const { validarCamposExtra } = require('../../config/fields.config');
const { featuresDe } = require('../../config/features.config');

const productoSchema = z.object({
  sku: z.string().optional().nullable(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().optional().nullable(),
  precio: z.number().nonnegative(),
  costo: z.number().nonnegative().optional().nullable(),
  stock: z.number().optional().default(0),
  stockMinimo: z.number().optional().nullable(),
  ivaAlicuota: z.number().default(21),
  imagen: z.string().optional().nullable(), // data URI base64, ya redimensionada en el navegador
  camposExtra: z.record(z.any()).optional().default({}),
});

async function listar(req, res) {
  const { comercioId } = req.user;
  const { busqueda, categoria, activo } = req.query;

  const productos = await prisma.producto.findMany({
    where: {
      comercioId,
      activo: activo === undefined ? true : activo === 'true',
      ...(categoria ? { categoria } : {}),
      ...(busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda, mode: 'insensitive' } },
              { sku: { contains: busqueda, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: 'asc' },
  });

  res.json(productos);
}

async function obtener(req, res) {
  const { comercioId } = req.user;
  const producto = await prisma.producto.findFirst({
    where: { id: req.params.id, comercioId },
  });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(producto);
}

async function crear(req, res) {
  const { comercioId, plan } = req.user;
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const erroresCustom = validarCamposExtra('producto', parsed.data.camposExtra);
  if (erroresCustom.length) return res.status(400).json({ error: erroresCustom.join(' | ') });

  // Respeta el límite de productos del plan (features.config.js)
  const { limiteProductos } = featuresDe(plan);
  if (limiteProductos !== null) {
    const total = await prisma.producto.count({ where: { comercioId, activo: true } });
    if (total >= limiteProductos) {
      return res.status(402).json({ error: `Tu plan permite hasta ${limiteProductos} productos activos.` });
    }
  }

  if (parsed.data.sku) {
    const existe = await prisma.producto.findFirst({ where: { comercioId, sku: parsed.data.sku } });
    if (existe) return res.status(409).json({ error: 'Ya existe un producto con ese SKU.' });
  }

  const producto = await prisma.producto.create({
    data: { ...parsed.data, comercioId },
  });

  res.status(201).json(producto);
}

async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = productoSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.producto.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Producto no encontrado.' });

  const producto = await prisma.producto.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json(producto);
}

/** Baja lógica — nunca se borra un producto de verdad (rompería el historial de ventas). */
async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.producto.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Producto no encontrado.' });

  await prisma.producto.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
