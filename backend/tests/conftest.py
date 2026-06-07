"""Shared fixtures for the test suite."""

import os
import sys

# Ensure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Provide dummy env vars so that ``app.config.config.Settings`` can be
# instantiated without a real ``.env`` file.  These are only used during
# testing and never hit a real database.
_DEFAULTS = {
    "POSTGRES_USER": "test",
    "POSTGRES_PASSWORD": "test",
    "POSTGRES_DB": "test",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": "5432",
    "POSTGRESQL_URI": "postgresql://test:test@localhost:5432/test",
    "SECRET_KEY": "testing-secret-key-do-not-use-in-production",
    "JWT_ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "REFRESH_TOKEN_EXPIRE_MINUTES": "1440",
}

for key, val in _DEFAULTS.items():
    os.environ.setdefault(key, val)
