# whatsapp-sender-saas

NestJS + Prisma + BullMQ + PostgreSQL + Redis.

## Como rodar

1. Copie `.env.example` para `.env` e preencha `APP_ENC_KEY` (base64 de 32 bytes).
2. Suba dependências:

```bash
docker-compose up -d postgres redis
```

3. Instale dependências e gere client:

```bash
npm install
npm run generate
```

4. Rode a migration (SQL manual ou Prisma):

```bash
# via Prisma
npm run migration:run

# ou execute migrations/0001_init.sql no Postgres
```

5. Crie o tenant inicial:

```bash
npm run seed
```

6. Suba API e Worker:

```bash
npm run start:dev
npm run worker:dev
```

## Exemplos

Todos os endpoints exigem o header `x-api-key: <TENANT_API_KEY>`.

POST /api/messages/send

```json
{
  "to": "5511999999999",
  "message": "Olá, tudo bem?",
  "media_url": null,
  "template_name": null,
  "phone_id": null
}
```

Resposta:

```json
{
  "message_id": "uuid",
  "status": "queued"
}
```

POST /api/messages/batch

```json
{
  "items": [
    { "to": "5511999...", "message": "Msg 1" },
    { "to": "5511888...", "message": "Msg 2" }
  ],
  "phone_id": null
}
```

GET /api/messages/:id

```json
{
  "id": "uuid",
  "status": "sent",
  "to": "5511999...",
  "type": "text",
  "attempts": 1,
  "provider_message_id": "wamid...",
  "error_message": null,
  "created_at": "...",
  "sent_at": "...",
  "last_attempts": [
    { "attempt_number": 1, "success": true, "http_status": 200, "created_at": "..." }
  ]
}
```
