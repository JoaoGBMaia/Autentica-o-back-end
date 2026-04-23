# Sistema de Autenticacao de Usuarios

Este projeto foi desenvolvido por mim como uma base completa de autenticacao back-end com interface web integrada. A ideia foi construir uma aplicacao simples de executar, mas com recursos que se aproximam de um fluxo real de produto: cadastro, login, controle de sessao, refresh token, atualizacao de perfil e troca de senha.

O objetivo aqui nao foi apenas fazer o login funcionar, mas organizar a aplicacao de forma clara, com separacao de responsabilidades, validaçoes e uma estrutura que possa evoluir para banco de dados e ambiente de producao.

## Visao geral

- API REST com Node.js e Express
- autenticacao com `JWT` e `refreshToken`
- front-end integrado para cadastro, login e gerenciamento de conta
- controle de sessoes ativas
- atualizacao de perfil
- troca de senha com revogacao de sessao
- persistencia local em arquivo JSON para facilitar testes e demonstracao

## Demonstracao do fluxo

O sistema permite:

- criar uma conta
- realizar login
- acessar rota protegida
- renovar a sessao com `refreshToken`
- visualizar sessoes ativas
- encerrar sessoes
- atualizar nome e email
- alterar senha com seguranca

## Tecnologias utilizadas

- Node.js
- Express
- JWT
- bcryptjs
- dotenv
- HTML
- CSS
- JavaScript

## Estrutura do projeto

```txt
src/
  config/
  controllers/
  middleware/
  repositories/
  routes/
  services/
  utils/
public/
data/
```

## Arquitetura

Organizei o projeto em camadas para deixar a manutencao mais simples:

- `controllers`: recebem a requisicao e retornam a resposta
- `services`: concentram as regras de negocio da autenticacao
- `repositories`: fazem a leitura e gravacao dos usuarios
- `middleware`: tratam autenticacao, erros e rotas nao encontradas
- `utils`: centralizam validacoes, tokens e erros customizados

## Funcionalidades implementadas

- cadastro de usuario
- login com emissao de `accessToken` e `refreshToken`
- refresh de sessao
- logout por `refreshToken`
- logout da sessao atual
- perfil autenticado
- atualizacao de perfil
- alteracao de senha
- listagem de sessoes
- revogacao de sessoes
- validacao de dados de entrada
- hash de senha com `bcryptjs`

## Como executar localmente

1. Instale o Node.js 18 ou superior.
2. Instale as dependencias:

```powershell
npm install
```

3. Crie seu arquivo `.env` com base no arquivo `.env.example`.
4. Inicie a aplicacao:

```powershell
npm run dev
```

5. Acesse:

- `http://localhost:3001`
- `http://localhost:3001/health`
- `http://localhost:3001/api`

## Variaveis de ambiente

Exemplo:

```env
PORT=3001
JWT_SECRET=troque-esta-chave-por-uma-bem-segura
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=7
```

## Endpoints principais

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

## Exemplos de requisicao

### Cadastro

```json
{
  "name": "Gabriel",
  "email": "gabriel@email.com",
  "password": "123456"
}
```

### Login

```json
{
  "email": "gabriel@email.com",
  "password": "123456"
}
```

### Refresh de token

```json
{
  "refreshToken": "SEU_REFRESH_TOKEN"
}
```

### Atualizacao de perfil

```json
{
  "name": "Novo Nome"
}
```

### Troca de senha

```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

Para as rotas protegidas, envie:

```txt
Authorization: Bearer SEU_ACCESS_TOKEN
```

## Como testar

### Script PowerShell

Criei um script para validar o fluxo principal da API:

```powershell
.\test-api.ps1
```

Esse teste cobre:

- health check
- cadastro
- login
- consulta de perfil
- sessoes
- update de perfil
- refresh token
- troca de senha
- novo login
- logout

### Arquivo HTTP

Tambem deixei um arquivo `auth.http` para testar as rotas no VS Code com a extensao REST Client.

## Persistencia

Atualmente os usuarios e sessoes sao salvos em `data/users.json`.

Essa escolha foi intencional para deixar o projeto simples de rodar e facil de avaliar. Para producao, o caminho ideal e migrar para um banco como PostgreSQL ou MongoDB.

## Deploy

### Vercel

O projeto foi ajustado para funcionar na Vercel com front-end e API no mesmo deploy.

Observacao importante:

- na Vercel, o armazenamento em arquivo e temporario
- para demonstracao, a aplicacao usa `/tmp/auth-data` quando detecta esse ambiente
- se a ideia for manter usuarios reais e dados persistentes, e melhor usar banco de dados

### Render

Tambem preparei o projeto para Render usando `render.yaml`, que e uma opcao melhor quando a prioridade e persistencia em disco sem banco de dados logo de inicio.

## Evolucoes que eu faria na proxima versao

- migracao para PostgreSQL com Prisma
- cookies `httpOnly` para sessao web
- confirmacao de email
- recuperacao de senha
- rate limit
- `helmet`
- testes automatizados com Jest ou Vitest
- perfis de acesso como `admin` e `user`

## Consideracoes finais

Esse projeto representa bem a forma como eu gosto de construir back-end: com preocupacao em organizacao, seguranca basica, clareza de fluxo e espaco para evolucao. Ele funciona como estudo, MVP e tambem como uma boa base para ampliar para um sistema mais robusto.
