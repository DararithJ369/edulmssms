# Backend (FastAPI)

## Setup
```zsh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run
```zsh
uvicorn app.main:app --reload
```

## Environment
- Create a `.env` file based on `.env.example` if present.
- Ensure `SECRET_KEY` and database settings are set before running.
