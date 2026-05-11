# ◈ NEXUS — Real-Time Chat Application

A production-ready real-time multi-room chat app built with:

- **Backend**: Django + Django Channels (ASGI / WebSockets)
- **Database**: MongoDB via Motor (async driver) with in-memory fallback
- **Frontend**: React (Create React App)
- **Real-time**: WebSockets with Django Channels + InMemoryChannelLayer

---

## Architecture

```
┌─────────────────────┐     WebSocket     ┌────────────────────────┐
│   React Frontend    │◄─────────────────►│   Django Channels      │
│   (port 3000)       │                   │   ASGI (Daphne)        │
│                     │     HTTP/REST     │   (port 8000)          │
│   - Login           │◄─────────────────►│                        │
│   - Sidebar (rooms) │                   │   ChatConsumer         │
│   - ChatRoom        │                   │   ├── Presence tracking│
│   - Typing Ind.     │                   │   ├── Typing events    │
│   - Online users    │                   │   └── Message history  │
└─────────────────────┘                   └──────────┬─────────────┘
                                                     │
                                          ┌──────────▼─────────────┐
                                          │   MongoDB (Motor)      │
                                          │   ├── rooms collection │
                                          │   └── messages col.    │
                                          │   (fallback: in-memory)│
                                          └────────────────────────┘
```

## WebSocket Events

| Event       | Direction       | Payload                                      |
|-------------|----------------|----------------------------------------------|
| `history`   | Server → Client | `{ messages: [...] }`                        |
| `message`   | Bidirectional  | `{ type, text }` / `{ type, message }`       |
| `presence`  | Server → Client | `{ event, username, online: [] }`            |
| `typing`    | Bidirectional  | `{ type, is_typing }` / `{ type, username }` |

## Features

- ✅ Real-time messaging with WebSockets
- ✅ Multi-room support with custom room creation
- ✅ Typing indicators
- ✅ Online presence tracking
- ✅ Message history (MongoDB or in-memory)
- ✅ Graceful MongoDB fallback (in-memory store)
- ✅ CORS configured for local dev
- ✅ Dark terminal-inspired UI

---

## Running the Project

### 1. Backend (Django + Daphne)

```bash
pip install -r requirements.txt

# With MongoDB running:
MONGO_URI=mongodb://localhost:27017 daphne -b 0.0.0.0 -p 8000 core.asgi:application

# Without MongoDB (uses in-memory store):
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

### 2. Frontend (React)

```bash
cd ../chatapp-frontend
npm install
npm start   # Dev server on http://localhost:3000
```

### 3. Production Build

```bash
cd chatapp-frontend && npm run build
# Serve build/ folder with any static file server
```

---

## REST API

| Method | Endpoint                          | Description          |
|--------|-----------------------------------|----------------------|
| GET    | `/api/rooms/`                     | List all rooms       |
| POST   | `/api/rooms/create/`              | Create a room        |
| GET    | `/api/rooms/<room>/messages/`     | Get message history  |

## WebSocket URL

```
ws://localhost:8000/ws/chat/<room_name>/?username=<your_username>
```

---

## Scaling Notes

To scale beyond a single server:
- Replace `InMemoryChannelLayer` with `channels_redis.RedisChannelLayer`
- Add Redis: `pip install channels-redis`
- Configure in settings: `"BACKEND": "channels_redis.core.RedisChannelLayer"`

