const { z } = require('zod');
const prisma = require('../../utils/prisma');
const { validarCamposExtra } = require('../../config/fields.config');

const clienteSchema = z.object({
  nombre: z.string().min(1),
  cuitDni: z.string().optional().nullable(),
  condicionFiscal: z.string().default('Consumidor Final'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  camposExtra: z.record(z.any()).optional().default({}),
});

async function listar(req, res) {
  const { comercioId } = req.user;
  const { busqueda } = req.query;
  const clientes = await prisma.cliente.findMany({
    where: {
      comercioId,
      activo: true,
      ...(busqueda ? { nombre: { contains: busqueda, mode: 'insensitive' } } : {}),
    },
    orderBy: { nombre: 'asc' },
  });
  res.json(clientes);
}

async function crear(req, res) {
  const { comercioId } = req.user;
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const erroresCustom = validarCamposExtra('cliente', parsed.data.camposExtra);
  if (erroresCustom.length) return res.status(400).json({ error: erroresCustom.join(' | ') });

  const cliente = await prisma.cliente.create({ data: { ...parsed.data, comercioId } });
  res.status(201).json(cliente);
}

async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = clienteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.cliente.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(cliente);
}

async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.cliente.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  await prisma.cliente.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, eliminar };
