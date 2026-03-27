# 🔥 PyroAlert Backend API

API REST para sistema de alertas e monitoramento PyroAlert, desenvolvida com Node.js, Express e MongoDB.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando](#-executando)
- [Documentação da API](#-documentação-da-api)
- [Autenticação OAuth2](#-autenticação-oauth2)
- [Autenticação de Dois Fatores (2FA)](#-autenticação-de-dois-fatores-2fa)
- [Endpoints](#-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)

## ✨ Funcionalidades

- **Autenticação OAuth2** com Access Token + Refresh Token
- **Autenticação de Dois Fatores (2FA)** compatível com Google Authenticator, Authy, etc.
- **Gerenciamento de Usuários** (registro, login, perfil, alteração de senha/email)
- **Gerenciamento de Dispositivos** IoT
- **Sistema de Alertas** com níveis de severidade
- **Telemetria** de sensores
- **Documentação Swagger** integrada
- **Segurança** com Helmet, CORS e bcrypt

## 🛠 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.18 | Framework web |
| MongoDB | 6+ | Banco de dados NoSQL |
| Mongoose | 7.0 | ODM para MongoDB |
| JWT | 9.0 | Tokens de autenticação |
| otplib | 12.0 | TOTP para 2FA |
| Swagger | 6.2 | Documentação da API |

## 📦 Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd pyroalert-backend

# Instalar dependências
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pyroalert
# ou MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/pyroalert

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=900

# Refresh Token
REFRESH_TOKEN_EXPIRES_DAYS=30

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# App (usado no 2FA)
APP_NAME=PyroAlert

# Adafruit IO (para integração automática de leituras)
ADAFRUIT_IO_KEY=sua-chave-aio-do-adafruit
ADAFRUIT_AUTO_SYNC=true
ADAFRUIT_SYNC_INTERVAL_MS=30000
# Opcional: lista de device_id separados por vírgula
# ADAFRUIT_SYNC_DEVICE_IDS=PYRO-TEST-001,PYRO-001
```

## 🚀 Executando

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor iniciará em `http://localhost:4000`

## 📚 Documentação da API

Acesse a documentação Swagger interativa em:

```
http://localhost:4000/api/docs
```

## 🔐 Autenticação OAuth2

A API implementa OAuth2 com os seguintes grant types:

### Password Grant (Login)

```bash
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "password",
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "totp_code": "123456"  # Opcional, apenas se 2FA estiver ativado
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "abc123def456...",
  "scope": "read write",
  "user": {
    "id": "...",
    "email": "usuario@exemplo.com",
    "name": "Nome",
    "role": "viewer"
  }
}
```

### Refresh Token Grant (Renovar Token)

```bash
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "abc123def456..."
}
```

### Revogação de Token (Logout)

```bash
POST /oauth/revoke
Content-Type: application/json

{
  "token": "refresh_token_aqui"
}
```

### Usar Token nas Requisições

```bash
GET /api/v1/devices
Authorization: Bearer <access_token>
```

## 🔒 Autenticação de Dois Fatores (2FA)

### Ativar 2FA

**1. Iniciar Setup:**
```bash
POST /api/v1/2fa/setup
Authorization: Bearer <token>
```

Retorna QR Code e secret para configurar no app autenticador.

**2. Verificar e Ativar:**
```bash
POST /api/v1/2fa/verify
Authorization: Bearer <token>

{
  "code": "123456"
}
```

Retorna 10 códigos de recuperação - **guarde-os em local seguro!**

### Login com 2FA

Se o usuário tem 2FA ativado, o login retornará:
```json
{
  "error": "mfa_required",
  "mfa_required": true,
  "mfa_type": "totp"
}
```

Faça o login novamente incluindo o código:
```json
{
  "grant_type": "password",
  "email": "...",
  "password": "...",
  "totp_code": "123456"
}
```

### Desativar 2FA

**Com código TOTP:**
```bash
POST /api/v1/2fa/disable
{
  "code": "123456",
  "password": "senha"
}
```

**Apenas com senha (emergência):**
```bash
DELETE /api/v1/2fa
{
  "password": "senha"
}
```

## 📍 Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Registrar novo usuário |
| POST | `/api/v1/auth/login` | Login (legado) |
| GET | `/api/v1/auth/me` | Dados do usuário logado |
| PUT | `/api/v1/auth/me` | Atualizar perfil |
| PUT | `/api/v1/auth/password` | Alterar senha |
| PUT | `/api/v1/auth/email` | Alterar email |
| DELETE | `/api/v1/auth/me` | Excluir conta |

### OAuth2

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/oauth/token` | Obter/renovar tokens |
| POST | `/oauth/revoke` | Revogar token |
| POST | `/oauth/revoke-all` | Revogar todos os tokens |
| POST | `/oauth/introspect` | Inspecionar token |

### Two-Factor Auth (2FA)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/2fa/status` | Status do 2FA |
| POST | `/api/v1/2fa/setup` | Iniciar configuração |
| POST | `/api/v1/2fa/verify` | Verificar e ativar |
| POST | `/api/v1/2fa/disable` | Desativar (com código) |
| DELETE | `/api/v1/2fa` | Remover (apenas senha) |
| POST | `/api/v1/2fa/recovery-codes` | Regenerar códigos |

### Dispositivos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/devices` | Listar dispositivos |
| POST | `/api/v1/devices` | Criar dispositivo |
| GET | `/api/v1/devices/:id` | Buscar dispositivo |
| PUT | `/api/v1/devices/:id` | Atualizar dispositivo |
| DELETE | `/api/v1/devices/:id` | Excluir dispositivo |

### Alertas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/alerts` | Listar alertas |
| POST | `/api/v1/alerts` | Criar alerta |
| GET | `/api/v1/alerts/:id` | Buscar alerta |
| PUT | `/api/v1/alerts/:id` | Atualizar alerta |
| DELETE | `/api/v1/alerts/:id` | Excluir alerta |

### Telemetria

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/telemetry` | Listar telemetria |
| POST | `/api/v1/telemetry` | Enviar telemetria |
| GET | `/api/v1/telemetry/:id` | Buscar telemetria |

### Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/health` | Status da API |

## 📁 Estrutura do Projeto

```
pyroalert-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Conexão MongoDB
│   │   └── swagger.js         # Configuração Swagger
│   ├── controllers/
│   │   ├── alertController.js
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   ├── oauthController.js
│   │   ├── telemetryController.js
│   │   └── twoFactorController.js
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticação
│   ├── models/
│   │   ├── Alert.js
│   │   ├── Device.js
│   │   ├── RefreshToken.js
│   │   ├── Rule.js
│   │   ├── Telemetry.js
│   │   └── User.js
│   ├── routes/
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── devices.js
│   │   ├── health.js
│   │   ├── oauth.js
│   │   ├── telemetry.js
│   │   └── twoFactor.js
│   ├── utils/
│   │   └── validator.js
│   └── index.js               # Entrada da aplicação
├── .env                       # Variáveis de ambiente
├── package.json
├── seed-admin.js              # Script para criar admin
├── test-connection.js         # Script para testar conexão
└── README.md
```

## 🔧 Scripts Úteis

### Criar Usuário Admin

```bash
node seed-admin.js <mongo_uri> <email> <password> [name] [id_number] [phone]

# Exemplo:
node seed-admin.js mongodb://localhost:27017/pyroalert admin@pyroalert.com senha123 "Admin" "12345678901" "11999998888"
```

### Testar Conexão com MongoDB

```bash
node test-connection.js
```

## 🔒 Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de acesso cross-origin
- **bcrypt**: Hash de senhas com salt
- **JWT**: Tokens assinados e com expiração
- **Refresh Token Rotation**: Tokens são rotacionados a cada uso
- **2FA/TOTP**: Autenticação de dois fatores
- **Códigos de Recuperação**: Backup para acesso de emergência

## 📝 Licença

Este projeto está sob a licença MIT.
