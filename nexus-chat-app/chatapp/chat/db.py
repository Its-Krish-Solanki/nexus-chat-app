"""
MongoDB async helpers using motor.
Falls back gracefully if MongoDB is not running (in-memory store for demo).
"""
import asyncio
import logging
from datetime import datetime, timezone
from bson import ObjectId

logger = logging.getLogger(__name__)

# In-memory fallback store
_rooms: dict = {}       # room_name -> {name, created_at, member_count}
_messages: list = []    # list of message dicts

USE_MONGO = False
_client = None
_db = None

async def get_db():
    global USE_MONGO, _client, _db
    if _db is not None:
        return _db
    try:
        import motor.motor_asyncio
        from django.conf import settings
        _client = motor.motor_asyncio.AsyncIOMotorClient(
            settings.MONGO_URI, serverSelectionTimeoutMS=2000
        )
        await _client.server_info()
        _db = _client[settings.MONGO_DB_NAME]
        USE_MONGO = True
        logger.info("Connected to MongoDB")
        return _db
    except Exception as e:
        logger.warning(f"MongoDB unavailable ({e}), using in-memory store")
        USE_MONGO = False
        return None


async def get_or_create_room(name: str) -> dict:
    db = await get_db()
    if USE_MONGO and db is not None:
        room = await db.rooms.find_one({"name": name})
        if not room:
            doc = {"name": name, "created_at": datetime.now(timezone.utc), "member_count": 0}
            result = await db.rooms.insert_one(doc)
            doc["_id"] = str(result.inserted_id)
            return doc
        room["_id"] = str(room["_id"])
        return room
    # In-memory
    if name not in _rooms:
        _rooms[name] = {"_id": name, "name": name, "created_at": datetime.now(timezone.utc).isoformat(), "member_count": 0}
    return _rooms[name]


async def list_rooms() -> list:
    db = await get_db()
    if USE_MONGO and db is not None:
        rooms = await db.rooms.find().to_list(100)
        for r in rooms:
            r["_id"] = str(r["_id"])
        return rooms
    return list(_rooms.values())


async def save_message(room: str, username: str, text: str) -> dict:
    msg = {
        "room": room,
        "username": username,
        "text": text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    db = await get_db()
    if USE_MONGO and db is not None:
        result = await db.messages.insert_one({**msg})
        msg["_id"] = str(result.inserted_id)
    else:
        msg["_id"] = str(len(_messages))
        _messages.append(msg)
    return msg


async def get_room_messages(room: str, limit: int = 50) -> list:
    db = await get_db()
    if USE_MONGO and db is not None:
        msgs = await db.messages.find({"room": room}).sort("timestamp", -1).limit(limit).to_list(limit)
        for m in msgs:
            m["_id"] = str(m["_id"])
        return list(reversed(msgs))
    return [m for m in _messages if m["room"] == room][-limit:]
