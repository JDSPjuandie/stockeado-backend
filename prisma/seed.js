/**
 * Carga un comercio de prueba con datos de ejemplo.
 * Uso: npm run seed
 * Es idempotente-ish: si corrés dos veces, crea un segundo comercio
 * de prueba (no pisa el anterior) — está pensado para ambiente de dev.
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin1234', 12);

  const comercio = await prisma.comercio.create({
    data: {
      nombre: 'Almacén Demo',
      plan: 'basico',
      usuarios: {
        create: { email: 'admin@demo.com', passwordHash, nombre: 'Admin Demo', rol: 'admin' },
      },
      productos: {
        create: [
          { nombre: 'Coca Cola 1.5L', sku: 'COC-15', precio: 2500, costo: 1600, stock: 40, stockMinimo: 10, ivaAlicuota: 21 },
          { nombre: 'Pan Lactal', sku: 'PAN-LAC', precio: 1800, costo: 1100, stock: 15, stockMinimo: 5, ivaAlicuota: 10.5 },
          { nombre: 'Detergente', sku: 'DET-500', precio: 3200, costo: 2000, stock: 25, stockMinimo: 8, ivaAlicuota: 21 },
        ],
      },
      clientes: {
        create: [{ nombre: 'Consumidor Final', condicionFiscal: 'Consumidor Final' }],
      },
    },
  });

  console.log('✓ Comercio demo creado:', comercio.id);
  console.log('  Login: admin@demo.com / admin1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
