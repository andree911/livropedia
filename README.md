# Livropédia

Catálogo de livros com avaliações, listas de leitura (quero ler / lendo / lido), busca via Google Books e tradução/resumo assistidos por IA.

- [`backend/`](./backend) — API em Python (Flask + SQLAlchemy + JWT), integração com Google Books e Anthropic para busca/tradução.
- [`frontend/`](./frontend) — aplicação Next.js.

## Rodando localmente

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy

- Frontend: [Vercel](https://livropedia.vercel.app)
- Backend: VPS própria, Docker + Traefik (`https://srv1892430.hstgr.cloud:3003`)

Detalhes em [`DEPLOY.md`](./DEPLOY.md).
