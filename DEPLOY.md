# Deploy na VPS pessoal

Essa VPS (Hostinger, `srv1892430.hstgr.cloud`) hospeda vários projetos com uma
estrutura compartilhada:

- `/opt/edge/` — Traefik (proxy reverso único pra todos os projetos, TLS via
  Let's Encrypt, rede Docker externa `edge`)
- `/opt/infra/` — serviços de estado compartilhados (Postgres, Mongo, etc.),
  rede Docker externa `db`
- `/opt/apps/<projeto>/` — um diretório por projeto, cada um com seu próprio
  `docker-compose.yml`, sem proxy reverso nem banco próprios

O Livropédia ainda não tem domínio próprio, então usa o hostname da VPS com
portas dedicadas (mesmo padrão do outro projeto hospedado aqui): frontend em
`:3002` e API em `:3003`, TLS terminado pelo Traefik.

## 1. Clonar o repositório

```bash
mkdir -p /opt/apps/livropedia
git clone https://github.com/andree911/livropedia.git /opt/apps/livropedia
cd /opt/apps/livropedia
```

## 2. Garantir que o Postgres compartilhado existe

Se `/opt/infra/postgres` ainda não existir, criar o serviço primeiro (ver
seção "Infra compartilhada" abaixo). Depois, criar o banco e usuário do
Livropédia dentro dele:

```bash
docker compose -f /opt/infra/postgres/docker-compose.yml exec postgres \
  psql -U root -c "CREATE USER livropedia WITH PASSWORD 'SENHA_FORTE_AQUI';"
docker compose -f /opt/infra/postgres/docker-compose.yml exec postgres \
  psql -U root -c "CREATE DATABASE livropedia OWNER livropedia;"
```

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edite os dois arquivos:

- `.env`: `FLASK_API_URL=https://srv1892430.hstgr.cloud:3003`,
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- `backend/.env`: `DATABASE_URL` com a senha criada no passo 2
  (`postgresql://livropedia:SENHA_FORTE_AQUI@postgres:5432/livropedia`),
  `SECRET_KEY` e `JWT_SECRET_KEY` (gere com
  `python3 -c "import secrets; print(secrets.token_hex(32))"`), `GOOGLE_CLIENT_ID`
  (mesmo valor do `NEXT_PUBLIC_GOOGLE_CLIENT_ID`), `SMTP_USER`/`SMTP_PASSWORD`,
  `FRONTEND_URL=https://srv1892430.hstgr.cloud:3002`, `ANTHROPIC_API_KEY`,
  `GOOGLE_BOOKS_API_KEY`.

## 4. Garantir que os entrypoints existem no Traefik

`/opt/edge/docker-compose.yml` precisa ter os entrypoints
`app-livropedia-web` (`:3002`) e `app-livropedia-api` (`:3003`) declarados no
`command:` e publicados em `ports:`. Depois de editar, aplicar com
`docker compose up -d` dentro de `/opt/edge` (reinicia o Traefik — some
segundos de indisponibilidade pros outros projetos também).

## 5. Subir os containers

```bash
docker compose up -d --build
```

Isso builda backend e frontend, aplica as migrations automaticamente (o
`app.py` roda `upgrade()` no boot), e registra as rotas no Traefik via
labels — o certificado TLS é emitido sozinho na primeira requisição.

## 6. Verificar

```bash
docker compose ps
docker compose logs -f backend
```

Acesse `https://srv1892430.hstgr.cloud:3002` (frontend) e
`https://srv1892430.hstgr.cloud:3003` (API, deve responder 404 na raiz —
normal, não tem rota `/`).

## 7. Atualizar depois de um novo push

```bash
git pull
docker compose up -d --build
```

## Backup

As capas de livro enviadas por usuário (`capas_data`) ficam num volume Docker
nomeado. Para backup do banco (compartilhado, dentro de `/opt/infra/postgres`):

```bash
docker compose -f /opt/infra/postgres/docker-compose.yml exec postgres \
  pg_dump -U livropedia livropedia > backup.sql
```

## Infra compartilhada (só na primeira vez, uma VPS pra todos os projetos)

`/opt/infra/postgres/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - db

networks:
  db:
    external: true

volumes:
  postgres_data:
```

`/opt/infra/postgres/.env`:

```
POSTGRES_USER=root
POSTGRES_PASSWORD=<senha forte>
POSTGRES_DB=postgres
```
