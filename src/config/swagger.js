const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PyroAlert API',
      version: '1.0.0',
      description: 'API para sistema de alertas e monitoramento PyroAlert',
      contact: {
        name: 'PyroAlert Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'admin@pyroalert.com' },
            name: { type: 'string', example: 'Administrador' },
            id_number: { type: 'string', example: '12345678901' },
            id_type: { type: 'string', enum: ['CPF', 'CNPJ'], example: 'CPF' },
            phone: { type: 'string', example: '11999998888' },
            role: { type: 'string', enum: ['admin', 'operator', 'viewer'], example: 'admin' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Device: {
          type: 'object',
          required: ['device_id'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            device_id: { type: 'string', example: 'PYRO-001' },
            dev_eui: { type: 'string', example: '0004A30B001C5A3E' },
            model: { type: 'string', example: 'PyroSensor v2' },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: -23.5505 },
                lng: { type: 'number', example: -46.6333 },
                alt: { type: 'number', example: 760 }
              }
            },
            status: { type: 'string', enum: ['online', 'offline', 'maintenance'], example: 'online' },
            last_seen: { type: 'string', format: 'date-time' },
            metadata: { type: 'object' }
          }
        },
        Alert: {
          type: 'object',
          required: ['alert_id', 'device_id'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            alert_id: { type: 'string', example: 'ALT-001' },
            device_id: { type: 'string', example: 'PYRO-001' },
            created_at: { type: 'string', format: 'date-time' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            type: { type: 'string', example: 'temperature_exceeded' },
            status: { type: 'string', enum: ['open', 'acknowledged', 'closed'], example: 'open' },
            payload: { type: 'object' }
          }
        },
        Telemetry: {
          type: 'object',
          required: ['device_id', 'timestamp'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            device_id: { type: 'string', example: 'PYRO-001' },
            timestamp: { type: 'string', format: 'date-time' },
            sensors: {
              type: 'object',
              example: { temperature: 45.2, humidity: 30, smoke: 0.8 }
            },
            battery_v: { type: 'number', example: 3.7 },
            gateway: { type: 'string', example: 'GW-001' },
            rssi: { type: 'number', example: -85 },
            snr: { type: 'number', example: 7.5 },
            raw_payload: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@pyroalert.com' },
            password: { type: 'string', example: 'senha123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expires_in: { type: 'number', example: 900 }
          }
        },
        PasswordGrant: {
          type: 'object',
          required: ['grant_type', 'email', 'password'],
          properties: {
            grant_type: { type: 'string', enum: ['password'], example: 'password' },
            email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
            password: { type: 'string', example: 'senha123' },
            totp_code: { type: 'string', example: '123456', description: 'Código 2FA (se habilitado)' },
            scope: { type: 'string', example: 'read write', description: 'Escopos separados por espaço' }
          }
        },
        RefreshTokenGrant: {
          type: 'object',
          required: ['grant_type', 'refresh_token'],
          properties: {
            grant_type: { type: 'string', enum: ['refresh_token'], example: 'refresh_token' },
            refresh_token: { type: 'string', example: 'abc123def456...' },
            scope: { type: 'string', example: 'read write' }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            token_type: { type: 'string', example: 'Bearer' },
            expires_in: { type: 'number', example: 900, description: 'Segundos até expirar' },
            refresh_token: { type: 'string', example: 'abc123def456...' },
            scope: { type: 'string', example: 'read write' }
          }
        },
        TokenIntrospection: {
          type: 'object',
          properties: {
            active: { type: 'boolean', example: true },
            token_type: { type: 'string', example: 'Bearer' },
            scope: { type: 'string', example: 'read write' },
            sub: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'usuario@exemplo.com' },
            exp: { type: 'number', example: 1699999999 },
            iat: { type: 'number', example: 1699999000 }
          }
        },
        OAuthError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'invalid_grant' },
            error_description: { type: 'string', example: 'Credenciais inválidas' }
          }
        },
        MFARequiredError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'mfa_required' },
            error_description: { type: 'string', example: 'Autenticação de dois fatores é necessária' },
            mfa_required: { type: 'boolean', example: true },
            mfa_type: { type: 'string', example: 'totp' }
          }
        },
        TwoFactorSetupResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                qrCode: { type: 'string', description: 'QR code como data URL (base64)' },
                secret: { type: 'string', description: 'Secret para entrada manual', example: 'JBSWY3DPEHPK3PXP' },
                otpauthUrl: { type: 'string', description: 'URL otpauth://' },
                instructions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        TwoFactorVerifyResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                recoveryCodes: { 
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['ABCD-EFGH-IJKL', 'MNOP-QRST-UVWX']
                },
                warning: { type: 'string' }
              }
            }
          }
        },
        RecoveryCodesResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                recoveryCodes: { 
                  type: 'array', 
                  items: { type: 'string' }
                },
                warning: { type: 'string' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'error_message' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
  tags: [
    { name: 'OAuth2', description: 'Endpoints OAuth2 para autenticação' },
    { name: 'Two-Factor Auth', description: 'Autenticação de dois fatores (2FA/TOTP)' },
    { name: 'Autenticação', description: 'Endpoints de autenticação legados' },
    { name: 'Dispositivos', description: 'Gerenciamento de dispositivos' },
    { name: 'Alertas', description: 'Gerenciamento de alertas' },
    { name: 'Telemetria', description: 'Dados de telemetria' },
    { name: 'Health', description: 'Status da API' }
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

