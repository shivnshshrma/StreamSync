# StreamSync backend

This is the Django/DRF/Channels API for StreamSync. It defaults to SQLite for local
development and accepts PostgreSQL, Redis, and S3-compatible storage through
environment variables.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py test
python manage.py runserver
```

WebSockets authenticate with the short-lived access token in the query string:
`/ws/rooms/<room-uuid>/?token=<access-token>`. Production deployments must use
`wss://` and should terminate TLS at the reverse proxy.
