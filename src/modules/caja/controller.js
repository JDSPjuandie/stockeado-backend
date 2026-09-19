const { z } = require('zod');
const prisma = require('../../utils/prisma');

async function sesionActiva(req, res) {
  const { comercioId } = req.user;
  const sesion = await prisma.sesionCaja.findFirst({
    where: { comercioId, estado: 'abierta' },
    orderBy: { fechaApertura: 'desc' },
  });
  res.json(sesion || null);
}

const aperturaSchema = z.object({ montoApertura: z.number().nonnegative() });

async function abrir(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = aperturaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const yaAbierta = await prisma.sesionCaja.findFirst({ where: { comercioId, estado: 'abierta' } });
  if (yaAbierta) return res.status(409).json({ error: 'Ya hay una caja abierta.' });

  const sesion = await prisma.sesionCaja.create({
    data: { comercioId, usuarioId, montoApertura: parsed.data.montoApertura },
  });
  res.status(201).json(sesion);
}

const cierreSchema = z.object({ montoCierre: z.number().nonnegative() });

async function cerrar(req, res) {
  const { comercioId } = req.user;
  const parsed = cierreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const sesion = await prisma.sesionCaja.findFirst({ where: { comercioId, estado: 'abierta' } });
  if (!sesion) return res.status(404).json({ error: 'No hay caja abierta.' });

  const movimientos = await prisma.movimientoCaja.findMany({ where: { sesionCajaId: sesion.id } });
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + Number(m.monto), 0);
  const egresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + Number(m.monto), 0);
  const esperado = Number(sesion.montoApertura) + ingresos - egresos;
  const diferencia = parsed.data.montoCierre - esperado;

  const actualizada = await prisma.sesionCaja.update({
    where: { id: sesion.id },
    data: { montoCierre: parsed.data.montoCierre, fechaCierre: new Date(), estado: 'cerrada' },
  });

  res.json({ ...actualizada, esperado, diferencia });
}

const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  monto: z.number().positive(),
  concepto: z.string().min(1),
});

async function registrarMovimiento(req, res) {
  const { comercioId, id: usuarioId } = req.user;
  const parsed = movimientoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const sesion = await prisma.sesionCaja.findFirst({ where: { comercioId, estado: 'abierta' } });
  if (!sesion) return res.status(409).json({ error: 'No hay caja abierta. Abrí la caja antes de registrar movimientos.' });

  const movimiento = await prisma.movimientoCaja.create({
    data: { comercioId, sesionCajaId: sesion.id, usuarioId, ...parsed.data },
  });
  res.status(201).json(movimiento);
}

async function movimientosDeSesion(req, res) {
  const { comercioId } = req.user;
  const sesion = await prisma.sesionCaja.findFirst({ where: { comercioId, estado: 'abierta' } });
  if (!sesion) return res.json([]);
  const movimientos = await prisma.movimientoCaja.findMany({
    where: { sesionCajaId: sesion.id },
    orderBy: { fecha: 'desc' },
  });
  res.json(movimientos);
}

module.exports = { sesionActiva, abrir, cerrar, registrarMovimiento, movimientosDeSesion };
