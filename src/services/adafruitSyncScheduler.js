const Device = require('../models/Device');
const { syncReadingsByDeviceId } = require('./adafruitService');

let syncTimer = null;
let isSyncRunning = false;

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined) return defaultValue;
  return !['false', '0', 'no', 'off'].includes(String(value).toLowerCase());
};

const parseTargetDevices = () => {
  const raw = process.env.ADAFRUIT_SYNC_DEVICE_IDS || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveDevicesToSync = async () => {
  const configuredDevices = parseTargetDevices();
  if (configuredDevices.length > 0) return configuredDevices;

  const devices = await Device.find({}, 'device_id').lean().exec();
  return devices.map((device) => device.device_id).filter(Boolean);
};

const runSyncCycle = async () => {
  if (isSyncRunning) {
    console.log('[AdafruitScheduler] Ciclo anterior ainda em execução. Pulando este ciclo.');
    return;
  }

  isSyncRunning = true;

  try {
    const devices = await resolveDevicesToSync();
    if (devices.length === 0) {
      console.log('[AdafruitScheduler] Nenhum dispositivo encontrado para sincronizar.');
      return;
    }

    const startedAt = Date.now();
    const results = await Promise.allSettled(
      devices.map((deviceId) => syncReadingsByDeviceId(deviceId))
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const errorCount = results.length - successCount;
    const elapsedMs = Date.now() - startedAt;

    console.log(
      `[AdafruitScheduler] Sincronização concluída em ${elapsedMs}ms | sucesso: ${successCount} | erro: ${errorCount}`
    );

    if (errorCount > 0) {
      results
        .filter((result) => result.status === 'rejected')
        .forEach((result) => {
          console.error('[AdafruitScheduler] Falha na sincronização:', result.reason?.message || result.reason);
        });
    }
  } catch (error) {
    console.error('[AdafruitScheduler] Erro no ciclo de sincronização:', error.message);
  } finally {
    isSyncRunning = false;
  }
};

const startAdafruitAutoSync = () => {
  if (syncTimer) return;

  const enabled = parseBoolean(process.env.ADAFRUIT_AUTO_SYNC, true);
  if (!enabled) {
    console.log('[AdafruitScheduler] Sincronização automática desabilitada por configuração.');
    return;
  }

  const intervalMs = Number(process.env.ADAFRUIT_SYNC_INTERVAL_MS || 30000);
  if (!Number.isFinite(intervalMs) || intervalMs < 5000) {
    console.log('[AdafruitScheduler] Intervalo inválido. Usando 30000ms.');
  }
  const safeIntervalMs = Number.isFinite(intervalMs) && intervalMs >= 5000 ? intervalMs : 30000;

  console.log(`[AdafruitScheduler] Sincronização automática iniciada. Intervalo: ${safeIntervalMs}ms`);

  runSyncCycle().catch((error) => {
    console.error('[AdafruitScheduler] Erro no ciclo inicial:', error.message);
  });

  syncTimer = setInterval(() => {
    runSyncCycle().catch((error) => {
      console.error('[AdafruitScheduler] Erro no ciclo agendado:', error.message);
    });
  }, safeIntervalMs);
};

module.exports = {
  startAdafruitAutoSync
};
