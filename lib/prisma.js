const { PrismaClient } = require('@prisma/client');

// Configuração para evitar prepared statements duplicados
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configurações para resolver problemas de prepared statements
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Função para reconectar o Prisma em caso de erro
async function reconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.warn('Erro ao desconectar Prisma:', error.message);
  }
  
  try {
    await prisma.$connect();
    console.log('✅ Prisma reconectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao reconectar Prisma:', error.message);
  }
}

// Middleware para lidar com erros de prepared statements
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    if (error.message && error.message.includes('prepared statement')) {
      console.warn('⚠️ Erro de prepared statement detectado, tentando reconectar...');
      await reconnectPrisma();
      // Tentar novamente após reconectar
      try {
        return await next(params);
      } catch (retryError) {
        console.error('❌ Erro persistente após reconexão:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
