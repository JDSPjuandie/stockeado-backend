const { PrismaClient } = require('@prisma/client');

// Singleton — evita abrir una conexión nueva por cada import
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
