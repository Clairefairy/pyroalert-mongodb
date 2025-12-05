/**
 * Script de importação de leituras do Adafruit IO
 * 
 * Uso: node import-readings.js
 * 
 * Importa os arquivos JSON da pasta /JSON para o MongoDB
 * como leituras do dispositivo de teste (PYRO-TEST-001)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Reading = require('./src/models/Reading');
const Device = require('./src/models/Device');

// Mapeamento dos arquivos para os sensores
const FILE_SENSOR_MAP = {
  'fumo': 'smoke',
  'sense22': 'sense',
  'tempAr22': 'temp',    // temperatura
  'umiAr22': 'humid',    // umidade do ar
  'umiSolo': 'moist'     // umidade do solo
};

// ID do dispositivo de teste
const DEVICE_ID = 'PYRO-TEST-001';

/**
 * Corrige o fuso horário (API está 3h adiantada)
 */
const correctTimezone = (dateStr) => {
  const date = new Date(dateStr);
  date.setHours(date.getHours() - 3);
  return date;
};

/**
 * Carrega e parseia um arquivo JSON
 */
const loadJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Erro ao ler ${filePath}:`, err.message);
    return [];
  }
};

/**
 * Identifica o sensor pelo nome do arquivo
 */
const getSensorFromFilename = (filename) => {
  for (const [key, sensor] of Object.entries(FILE_SENSOR_MAP)) {
    if (filename.toLowerCase().includes(key.toLowerCase())) {
      return sensor;
    }
  }
  return null;
};

async function importReadings() {
  console.log('🚀 Iniciando importação de leituras...\n');
  
  // Conectar ao MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado ao MongoDB\n');
  
  // Buscar dispositivo
  const device = await Device.findOne({ device_id: DEVICE_ID }).exec();
  if (!device) {
    console.error(`❌ Dispositivo ${DEVICE_ID} não encontrado!`);
    process.exit(1);
  }
  console.log(`📱 Dispositivo: ${device.device_id} (${device._id})\n`);
  
  // Listar arquivos JSON
  const jsonDir = path.join(__dirname, 'JSON');
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Arquivos encontrados: ${files.length}`);
  files.forEach(f => console.log(`   - ${f}`));
  console.log('');
  
  // Carregar todos os dados
  const allData = {};
  
  for (const file of files) {
    const sensor = getSensorFromFilename(file);
    if (!sensor) {
      console.log(`⚠️  Sensor não identificado para ${file}, pulando...`);
      continue;
    }
    
    const filePath = path.join(jsonDir, file);
    const data = loadJsonFile(filePath);
    
    console.log(`📊 ${file} → ${sensor}: ${data.length} registros`);
    
    // Indexar por timestamp (arredondado para o minuto)
    data.forEach(item => {
      const date = new Date(item.created_at);
      // Arredondar para o minuto para agrupar leituras próximas
      date.setSeconds(0, 0);
      const key = date.toISOString();
      
      if (!allData[key]) {
        allData[key] = { timestamp: item.created_at };
      }
      
      allData[key][sensor] = {
        value: parseFloat(item.value),
        readAt: item.created_at
      };
    });
  }
  
  // Converter para array e ordenar por data
  const readings = Object.values(allData).sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  console.log(`\n📝 Total de leituras únicas: ${readings.length}`);
  console.log('');
  
  // Importar leituras
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log('💾 Importando leituras...\n');
  
  for (const data of readings) {
    try {
      // Preparar documento
      const readingDoc = {
        device: device._id,
        smoke: data.smoke ? {
          value: data.smoke.value,
          readAt: correctTimezone(data.smoke.readAt)
        } : undefined,
        sense: data.sense ? {
          value: data.sense.value,
          readAt: correctTimezone(data.sense.readAt)
        } : undefined,
        temp: data.temp ? {
          value: data.temp.value,
          readAt: correctTimezone(data.temp.readAt)
        } : undefined,
        humid: data.humid ? {
          value: data.humid.value,
          readAt: correctTimezone(data.humid.readAt)
        } : undefined,
        moist: data.moist ? {
          value: data.moist.value,
          readAt: correctTimezone(data.moist.readAt)
        } : undefined
      };
      
      // Verificar se tem pelo menos um sensor com dados
      const hasSensorData = ['smoke', 'sense', 'temp', 'humid', 'moist'].some(
        s => readingDoc[s] !== undefined
      );
      
      if (!hasSensorData) {
        skipped++;
        continue;
      }
      
      // Salvar
      const reading = new Reading(readingDoc);
      await reading.save();
      imported++;
      
      // Progresso a cada 50 registros
      if (imported % 50 === 0) {
        process.stdout.write(`   ${imported} importados...\r`);
      }
      
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`   Erro: ${err.message}`);
      }
    }
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log(`✅ Importação concluída!`);
  console.log(`   📥 Importados: ${imported}`);
  console.log(`   ⏭️  Pulados: ${skipped}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log('='.repeat(50));
  
  // Atualizar dispositivo
  device.last_seen = new Date();
  device.status = 'online';
  await device.save();
  
  // Estatísticas finais
  const totalReadings = await Reading.countDocuments({ device: device._id });
  console.log(`\n📊 Total de leituras do dispositivo: ${totalReadings}`);
  
  await mongoose.disconnect();
  console.log('\n🔌 Conexão encerrada.');
}

importReadings().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});

