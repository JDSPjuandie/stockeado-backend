const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../../utils/prisma');

const registrarSchema = z.object({
  nombreComercio: z.string().min(2),
  emailAdmin: z.string().email(),
  passwordAdmin: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombreAdmin: z.string().min(2),
  plan: z.enum(['basico', 'pro']).default('basico'),
});

/** Crea un comercio nuevo + su primer usuario admin. Uso interno tuyo al dar de alta un cliente. */
async function registrarComercio(req, res) {
  const parsed = registrarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { nombreComercio, emailAdmin, passwordAdmin, nombreAdmin, plan } = parsed.data;

  const passwordHash = await bcrypt.hash(passwordAdmin, 12);

  const comercio = await prisma.comercio.create({
    data: {
      nombre: nombreComercio,
      plan,
      usuarios: {
        create: {
          email: emailAdmin.toLowerCase().trim(),
          passwordHash,
          nombre: nombreAdmin,
          rol: 'admin',
        },
      },
    },
    include: { usuarios: true },
  });

  res.status(201).json({
    comercio: { id: comercio.id, nombre: comercio.nombre, plan: comercio.plan },
    usuario: { id: comercio.usuarios[0].id, email: comercio.usuarios[0].email },
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }
  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase().trim(), activo: true },
    include: { comercio: true },
  });

  // Mensaje genérico a propósito: no reveles si el email existe o no.
  const credencialesInvalidas = () => res.status(401).json({ error: 'Email o contraseña incorrectos.' });

  if (!usuario) return credencialesInvalidas();
  if (!usuario.comercio.activo) return res.status(403).json({ error: 'El comercio está suspendido.' });

  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) return credencialesInvalidas();

  const token = jwt.sign(
    {
      id: usuario.id,
      comercioId: usuario.comercioId,
      rol: usuario.rol,
      email: usuario.email,
      plan: usuario.comercio.plan,
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    comercio: { id: usuario.comercio.id, nombre: usuario.comercio.nombre, plan: usuario.comercio.plan },
  });
}

module.exports = { registrarComercio, login };
