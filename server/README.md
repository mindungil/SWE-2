# FastAPI Skeleton

Simple FastAPI starter with SQLite and example items API.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Migrations (Alembic)

- Edit `.env` if you want a different database URL (defaults to SQLite under `data/app.db`).
- Run migrations: `alembic upgrade head`
- Create new migration (after model changes): `alembic revision --autogenerate -m "desc"`

## Example

- `GET /health` – health check
- `GET /items` – list items
- `POST /items` – create an item (`{ \"name\": \"Widget\", \"description\": \"Demo\" }`)
- `GET /items/{id}` – fetch one item
