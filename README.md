# PyroAlert Backend

Backend para sistema de alertas PyroAlert usando Node.js + Express + MongoDB Atlas.

## Quickstart

1. Copie `.env.example` para `.env` e preencha os valores
2. `npm install`
3. `npm run dev`

## Configuração do MongoDB Atlas

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crie um cluster ou use um existente
3. Vá em **Database Access** e crie um usuário com permissão `readWrite`
4. Vá em **Network Access** e adicione seu IP (ou `0.0.0.0/0` para desenvolvimento)
5. Clique em **Connect** → **Drivers** e copie a connection string
6. Cole no `.env` como `MONGODB_URI`

## Criar usuário admin

```bash
node seed-admin.js "SUA_MONGODB_URI" admin senhaForte "Nome Completo" "12345678901" "11999999999"
```

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Login (retorna JWT) |
| GET | `/api/v1/devices` | Listar dispositivos |
| POST | `/api/v1/devices` | Criar dispositivo |
| GET | `/api/v1/alerts` | Listar alertas |
| POST | `/api/v1/telemetry` | Enviar telemetria |

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string do MongoDB Atlas |
| `PORT` | Porta do servidor (padrão: 4000) |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do token em segundos |
| `BCRYPT_SALT_ROUNDS` | Rounds para hash de senha (padrão: 10) |
