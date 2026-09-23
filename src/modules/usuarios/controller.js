const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../utils/prisma');
const { ROLES } = require('../../config/roles.config');
const { featuresDe } = require('../../config/features.config');

async function listar(req, res) {
  const { comercioId } = req.user;
  const usuarios = await prisma.usuario.findMany({
    where: { comercioId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, creadoEn: true },
    orderBy: { creadoEn: 'asc' },
  });
  res.json(usuarios);
}

const crearSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.string().refine((r) => Object.keys(ROLES).includes(r), 'Rol inválido'),
});

async function crear(req, res) {
  const { comercioId, plan } = req.user;
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { limiteUsuarios } = featuresDe(plan);
  if (limiteUsuarios !== null) {
    const total = await prisma.usuario.count({ where: { comercioId, activo: true } });
    if (total >= limiteUsuarios) {
      return res.status(402).json({ error: `Tu plan permite hasta ${limiteUsuarios} usuarios.` });
    }
  }

  const existe = await prisma.usuario.findFirst({ where: { comercioId, email: parsed.data.email.toLowerCase().trim() } });
  if (existe) return res.status(409).json({ error: 'Ya existe un usuario con ese email en tu comercio.' });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const usuario = await prisma.usuario.create({
    data: {
      comercioId,
      nombre: parsed.data.nombre,
      email: parsed.data.email.toLowerCase().trim(),
      rol: parsed.data.rol,
      passwordHash,
    },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  res.status(201).json(usuario);
}

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  rol: z.string().refine((r) => Object.keys(ROLES).includes(r), 'Rol inválido').optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

async function actualizar(req, res) {
  const { comercioId, id: solicitanteId } = req.user;
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.usuario.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'Usuario no encontrado.' });

  // Nadie puede desactivarse ni quitarse el rol admin a sí mismo — evita quedarse
  // sin ningún admin en el comercio por accidente.
  if (req.params.id === solicitanteId && (parsed.data.activo === false || (parsed.data.rol && parsed.data.rol !== 'admin'))) {
    return res.status(400).json({ error: 'No podés desactivarte ni cambiar tu propio rol de administrador.' });
  }

  const { password, ...resto } = parsed.data;
  const data = { ...resto };
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  res.json(usuario);
}

module.exports = { listar, crear, actualizar };
