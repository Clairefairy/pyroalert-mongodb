require('dotenv').config();
const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/db');

const app = express();

// Middlewares de segurança e parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Conectar ao banco de dados
connectDB(process.env.MONGODB_URI);

// ==================== ROTAS ====================

// Rota raiz - informações da API
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'PyroAlert API',
    version: '1.0.0',
    description: 'API para sistema de alertas e monitoramento',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      oauth: '/oauth',
      '2fa': '/api/v1/2fa',
      devices: '/api/v1/devices',
      readings: '/api/v1/readings',
      adafruit: '/api/v1/adafruit',
      alerts: '/api/v1/alerts',
      telemetry: '/api/v1/telemetry'
    }
  });
});

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PyroAlert API - Documentação'
}));

// JSON spec endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1/health', require('./routes/health'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/devices', require('./routes/devices'));
app.use('/api/v1/readings', require('./routes/readings'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/telemetry', require('./routes/telemetry'));

// OAuth2 Routes
app.use('/oauth', require('./routes/oauth'));

// Two-Factor Authentication Routes
app.use('/api/v1/2fa', require('./routes/twoFactor'));

// Adafruit IO Integration Routes
app.use('/api/v1/adafruit', require('./routes/adafruit'));

// ==================== ERROR HANDLERS ====================

// 404 - Rota não encontrada
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    hint: 'Verifique a documentação em /api/docs'
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== START SERVER ====================

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log('='.repeat(50));
  console.log(`🔥 PyroAlert API v1.0.0`);
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Documentação em http://localhost:${port}/api/docs`);
  console.log('='.repeat(50));
});
