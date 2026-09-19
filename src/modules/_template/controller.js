// ============================================================
// TEMPLATE DE CONTROLLER — copiá esta carpeta entera para un
// módulo nuevo y adaptá lo que está entre <> 
// Ver CONTRIBUTING.md → "Agregar un módulo nuevo" para el paso a paso completo.
// ============================================================

const { z } = require('zod');
const prisma = require('../../utils/prisma');

// 1. Definí la forma de los datos que este módulo recibe
const <Entidad>Schema = z.object({
  nombre: z.string().min(1),
  // ...resto de los campos
});

// 2. Listar (siempre filtrado por comercioId — NUNCA olvidar esto,
//    es lo que garantiza que un comercio no vea datos de otro)
async function listar(req, res) {
  const { comercioId } = req.user;
  const registros = await prisma.<entidad>.findMany({ where: { comercioId } });
  res.json(registros);
}

// 3. Crear
async function crear(req, res) {
  const { comercioId } = req.user;
  const parsed = <Entidad>Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const registro = await prisma.<entidad>.create({ data: { ...parsed.data, comercioId } });
  res.status(201).json(registro);
}

// 4. Actualizar
async function actualizar(req, res) {
  const { comercioId } = req.user;
  const parsed = <Entidad>Schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const existente = await prisma.<entidad>.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'No encontrado.' });

  const registro = await prisma.<entidad>.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(registro);
}

// 5. Eliminar (preferí baja lógica con `activo: false` si el registro
//    puede estar referenciado en ventas/historial — ver ejemplo en productos/controller.js)
async function eliminar(req, res) {
  const { comercioId } = req.user;
  const existente = await prisma.<entidad>.findFirst({ where: { id: req.params.id, comercioId } });
  if (!existente) return res.status(404).json({ error: 'No encontrado.' });

  await prisma.<entidad>.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, eliminar };
