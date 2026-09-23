const { z } = require('zod');
const prisma = require('../../utils/prisma');

const proveedorSchema = z.object({
  nombre: z.string().min(1),
  cuit: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  rubro: z.string().optional().nullable(),
});

async function listar(req, res) {
  const { comercioId } = req.user;
  const { busqueda } = req.query;
  const proveedores = await prisma.proveedor.findMany({
    where: {
      comercioId,
      activo: true,
      ...(busqueda ? { nombre: { contains: busqueda, mode: 'insensitive' } } : {}),
    },
    orderBy: { nombre: 'asc' },
  });
  res.json(proveedores);
}

async function crear(req, res) {
  const { comercioId } = req.user;
  const parsed = proveedorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const proveedor = await prisma.proveedor.create({ data: { ...parsed.data, comercioId } });
  res.status(201).json(proveedor);
}

async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = proveedorSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.proveedor.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Proveedor no encontrado.' });

  const proveedor = await prisma.proveedor.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(proveedor);
}

async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.proveedor.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Proveedor no encontrado.' });

  await prisma.proveedor.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, eliminar };
