const { z } = require('zod');
const prisma = require('../../utils/prisma');

async function obtener(req, res) {
  const { comercioId } = req.user;
  const comercio = await prisma.comercio.findUnique({
    where: { id: comercioId },
    select: { id: true, nombre: true, razonSocial: true, cuit: true, direccion: true, plan: true },
  });
  res.json(comercio);
}

const schema = z.object({
  nombre: z.string().min(1).optional(),
  razonSocial: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
});

// Solo admin puede tocar esto (se valida por permiso en routes.js). No se
// permite cambiar `plan` desde acá — eso lo maneja únicamente quien vende
// el sistema (vos), no el propio comercio.
async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const comercio = await prisma.comercio.update({
    where: { id: comercioId },
    data: parsed.data,
    select: { id: true, nombre: true, razonSocial: true, cuit: true, direccion: true, plan: true },
  });
  res.json(comercio);
}

module.exports = { obtener, actualizar };
