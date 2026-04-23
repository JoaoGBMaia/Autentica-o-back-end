# Autenticacao de usuario - back-end completo

API de autenticacao feita com Node.js e Express, pronta para estudo, portfolio ou base de projeto real.

## O que ja esta pronto

- cadastro de usuario
- login com `accessToken` e `refreshToken`
- renovacao de sessao
- logout por refresh token
- logout da sessao atual
- rota protegida de perfil
- atualizacao de perfil
- alteracao de senha
- listagem e revogacao de sessoes
- validacao de entrada
- senhas com hash usando `bcryptjs`
- persistencia local em arquivo JSON

## Estrutura

```txt
src/
  config/
  controllers/
  middleware/
  repositories/
  routes/
  services/
  utils/
```

## Tecnologias

- Node.js
- Express
- JWT
- bcryptjs
- dotenv

## Como rodar neste projeto

1. Instale o Node.js 18+.
2. Instale as dependencias:

```powershell
npm install
```

3. Inicie a API:

```powershell
npm run dev
```

4. Abra no navegador:

- `http://localhost:3001`
- `http://localhost:3001/health`

## Variaveis de ambiente

Use o arquivo `.env.example` como base:

```env
PORT=3001
JWT_SECRET=troque-esta-chave-por-uma-bem-segura
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=7
```

## Endpoints

### Publicos

- `GET /`
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Protegidos

- `GET /auth/me`
- `PATCH /auth/me`
- `GET /auth/sessions`
- `DELETE /auth/sessions/:sessionId`
- `POST /auth/logout-current`
- `POST /auth/change-password`

## Exemplos de body

### `POST /auth/register`

```json
{
  "name": "Gabriel",
  "email": "gabriel@email.com",
  "password": "123456"
}
```

### `POST /auth/login`

```json
{
  "email": "gabriel@email.com",
  "password": "123456"
}
```

### `POST /auth/refresh`

```json
{
  "refreshToken": "SEU_REFRESH_TOKEN"
}
```

### `PATCH /auth/me`

```json
{
  "name": "Novo Nome"
}
```

### `POST /auth/change-password`

```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

### Rotas protegidas

Envie no header:

```txt
Authorization: Bearer SEU_ACCESS_TOKEN
```

## Como testar rapido

### Script PowerShell

Rode:

```powershell
.\test-api.ps1
```

Esse script testa:

- health
- register
- me
- sessions
- update profile
- refresh
- change password
- login com nova senha
- logout

### Arquivo HTTP

Voce tambem pode usar `auth.http` no VS Code com extensao REST Client.

## Persistencia

Os usuarios e sessoes ficam salvos em:

- `data/users.json`

## Proximos passos recomendados

- migrar de JSON para PostgreSQL
- adicionar confirmacao de email
- adicionar recuperacao de senha
- adicionar roles como `admin` e `user`
- adicionar testes automatizados com Jest ou Vitest
- adicionar rate limit e helmet

## Observacoes

- Esta base e excelente para aprendizado e MVP.
- Para producao, prefira banco de dados real e cookies `httpOnly` quando houver frontend web.
