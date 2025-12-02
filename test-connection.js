/**
 * Script de teste de conexão com MongoDB Atlas
 * Uso: node test-connection.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

// Gera CPF aleatório (11 dígitos)
function gerarCPF() {
  const rand = () => Math.floor(Math.random() * 10);
  return Array.from({ length: 11 }, rand).join('');
}

// Gera telefone aleatório (11 dígitos)
function gerarTelefone() {
  const ddd = Math.floor(Math.random() * 90) + 10; // 10-99
  const prefixo = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  const sufixo = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `${ddd}9${prefixo}${sufixo}`;
}

async function testConnection() {
  console.log('🔌 Conectando ao MongoDB Atlas...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar criação de usuário com dados aleatórios
    const testUser = {
      email: `teste_${Date.now()}@pyroalert.com`,
      password: 'senha123',
      name: 'Usuário de Teste',
      id_number: gerarCPF(),
      phone: gerarTelefone(),
      role: 'viewer'
    };

    console.log('📝 Criando usuário de teste...');
    console.log('   Email:', testUser.email);
    console.log('   CPF gerado:', testUser.id_number);
    console.log('   Telefone gerado:', testUser.phone);
    
    const created = await User.createWithPassword(testUser);
    console.log('✅ Usuário criado:', {
      id: created._id,
      email: created.email,
      name: created.name,
      id_number: created.id_number,
      phone: created.phone,
      role: created.role
    });

    // Estatísticas
    const stats = {
      users: await User.countDocuments(),
    };

    // Importar outros models se existirem
    try {
      const Device = require('./src/models/Device');
      const Alert = require('./src/models/Alert');
      const Telemetry = require('./src/models/Telemetry');
      stats.devices = await Device.countDocuments();
      stats.alerts = await Alert.countDocuments();
      stats.telemetry = await Telemetry.countDocuments();
    } catch (e) {}

    console.log('\n📊 Estatísticas do banco:');
    console.table(stats);

    // Limpar usuário de teste
    await User.deleteOne({ _id: created._id });
    console.log('\n🧹 Usuário de teste removido.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    
    if (err.message.includes('ENOTFOUND')) {
      console.error('💡 Verifique se a URL do cluster está correta no .env');
    } else if (err.message.includes('Authentication failed')) {
      console.error('💡 Verifique usuário e senha no .env');
    } else if (err.message.includes('connect ETIMEDOUT')) {
      console.error('💡 Adicione seu IP na whitelist do Atlas (Network Access)');
    } else if (err.message.includes('Invalid scheme')) {
      console.error('💡 A URI deve começar com mongodb:// ou mongodb+srv://');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexão encerrada.');
  }
}

testConnection();

