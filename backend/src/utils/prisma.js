// Shared Prisma client — single instance (no duplicate connections)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

module.exports = prisma;
