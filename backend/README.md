# StreamSync backend

This is the Django/DRF/Channels API for StreamSync. It runs with no setup beyond
`pip install`: SQLite for data and an in-memory channel layer for WebSockets.
PostgreSQL, Redis, and S3-compatible storage are optional, through environment
variables.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py test
python manage.py runserver
```

There are no user accounts. When you create or join a room, you send only a
display name. The response contains a participant token for that room:

- HTTP requests send it in the `X-Participant-Token` header.
- WebSockets send it in the query string: `/ws/rooms/<room-uuid>/?token=<token>`.

The person who creates a room is its host. Only the host can control playback,
invite, remove people, change the video, and end the room.

The video library has no owner. Anyone who can reach the server can list and
upload videos. Do not expose the server to the public internet without a
reverse proxy that limits access. Use `wss://` and terminate TLS at the reverse
proxy for any deployment outside your own network.
