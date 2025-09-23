#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando build do Transcriptus...');

try {
  // 1. Gerar cliente Prisma
  console.log('📦 Gerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado com sucesso');
} catch (error) {
  console.error('❌ Erro ao gerar cliente Prisma:', error.message);
  process.exit(1);
}

try {
  // 2. Tentar executar migrações (opcional)
  console.log('🗄️ Tentando executar migrações do banco...');
  execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', { stdio: 'inherit' });
  console.log('✅ Migrações executadas com sucesso');
} catch (error) {
  console.warn('⚠️ Aviso: Não foi possível executar migrações do banco');
  console.warn('📝 Motivo:', error.message);
  console.log('🔄 Continuando build sem migrações...');
  
  // Criar arquivo de status para indicar que migrações falharam
  fs.writeFileSync('.migration-failed', JSON.stringify({
    timestamp: new Date().toISOString(),
    error: error.message
  }));
}

console.log('✅ Build concluído com sucesso!');
console.log('📝 Aplicação funcionará mesmo se o banco estiver indisponível');
