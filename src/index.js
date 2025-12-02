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
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Connect DB
connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/pyroalert');

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

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/devices', require('./routes/devices'));
app.use('/api/v1/telemetry', require('./routes/telemetry'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/health', require('./routes/health'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'internal_error', detail: err.message });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`PyroAlert API listening on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
});
