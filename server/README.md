# FastAPI Skeleton

Simple FastAPI starter with SQLite and example items API.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Example

- `GET /health` – health check
- `GET /items` – list items
- `POST /items` – create an item (`{ \"name\": \"Widget\", \"description\": \"Demo\" }`)
- `GET /items/{id}` – fetch one item
