# Deployment

## Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Run database migrations
docker-compose exec app npx prisma migrate deploy
```

## Dokploy

1. Conecte seu repositório GitHub ao Dokploy
2. Configure as variáveis de ambiente no painel do Dokploy
3. Deploy

Required env vars:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ENCRYPTION_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `NEXT_PUBLIC_APP_URL`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32+ char secret |
| `NEXTAUTH_URL` | Yes | Full URL of your app |
| `ENCRYPTION_KEY` | Yes | 64-char hex (32 bytes) |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_PORT` | For email | SMTP port (default: 587) |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASS` | For email | SMTP password |
| `SMTP_FROM` | For email | From address |
| `NEXT_PUBLIC_APP_URL` | For links | Public app URL |

## Generating Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```
