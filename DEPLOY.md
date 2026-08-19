# Deploy em VPS própria

Pré-requisitos na VPS: Docker + Docker Compose plugin instalados, portas 80 e 443
liberadas, e dois registros DNS apontando pro IP da VPS:

- `seu-dominio.com` → IP da VPS
- `api.seu-dominio.com` → IP da VPS

## 1. Clonar o repositório

```bash
git clone https://github.com/andree911/livropedia.git
cd livropedia
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edite os dois arquivos:

- `.env`: `POSTGRES_PASSWORD` (senha forte), `FLASK_API_URL=https://api.seu-dominio.com`,
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- `backend/.env`: `SECRET_KEY` e `JWT_SECRET_KEY` (gere com
  `python3 -c "import secrets; print(secrets.token_hex(32))"`), `GOOGLE_CLIENT_ID`
  (mesmo valor do `NEXT_PUBLIC_GOOGLE_CLIENT_ID`), `SMTP_USER`/`SMTP_PASSWORD`,
  `FRONTEND_URL=https://seu-dominio.com`, `ANTHROPIC_API_KEY`, `GOOGLE_BOOKS_API_KEY`.
  Deixe `DATABASE_URL` como está — o `docker-compose.yml` sobrescreve com o
  valor certo do serviço `db`.

## 3. Ajustar o Caddyfile

Edite `Caddyfile` na raiz e troque `seu-dominio.com` / `api.seu-dominio.com`
pelos seus domínios reais (nos dois blocos).

## 4. Subir os containers

```bash
docker compose up -d --build
```

Isso builda backend e frontend, sobe Postgres, aplica as migrations
automaticamente (o `app.py` roda `upgrade()` no boot) e sobe o Caddy, que
emite o certificado TLS sozinho na primeira requisição.

## 5. Verificar

```bash
docker compose ps
docker compose logs -f backend
```

Acesse `https://seu-dominio.com` (frontend) e `https://api.seu-dominio.com`
(API, deve responder 404 na raiz — normal, não tem rota `/`).

## 6. Atualizar depois de um novo push

```bash
git pull
docker compose up -d --build
```

## Backup

O banco (`db_data`) e as capas de livro enviadas por usuário (`capas_data`)
ficam em volumes Docker nomeados. Para backup do banco:

```bash
docker compose exec db pg_dump -U livropedia livropedia > backup.sql
```
