"""
WebSocket consumer for real-time chat rooms.
Each room has its own channel group; messages are fanned out to all members.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .db import save_message, get_room_messages, get_or_create_room

# Track online users per room: room_name -> set of usernames
_online: dict[str, set] = {}


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.group_name = f"chat_{self.room_name}"
        self.username = self.scope["query_string"].decode()
        # Parse ?username=...
        qs = dict(p.split("=") for p in self.username.split("&") if "=" in p)
        self.username = qs.get("username", "Anonymous")

        # Join channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Track presence
        _online.setdefault(self.room_name, set()).add(self.username)
        await get_or_create_room(self.room_name)

        # Send message history
        history = await get_room_messages(self.room_name)
        await self.send(text_data=json.dumps({"type": "history", "messages": history}))

        # Announce join
        await self.channel_layer.group_send(self.group_name, {
            "type": "presence_event",
            "event": "joined",
            "username": self.username,
            "online": list(_online[self.room_name]),
        })

    async def disconnect(self, close_code):
        if self.room_name in _online:
            _online[self.room_name].discard(self.username)

        await self.channel_layer.group_send(self.group_name, {
            "type": "presence_event",
            "event": "left",
            "username": self.username,
            "online": list(_online.get(self.room_name, set())),
        })
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type", "message")

        if msg_type == "message":
            text = data.get("text", "").strip()
            if not text:
                return
            saved = await save_message(self.room_name, self.username, text)
            await self.channel_layer.group_send(self.group_name, {
                "type": "chat_message",
                "message": saved,
            })

        elif msg_type == "typing":
            await self.channel_layer.group_send(self.group_name, {
                "type": "typing_event",
                "username": self.username,
                "is_typing": data.get("is_typing", False),
            })

    # ── Handlers (called by channel layer) ──────────────────────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"],
        }))

    async def presence_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "event": event["event"],
            "username": event["username"],
            "online": event["online"],
        }))

    async def typing_event(self, event):
        if event["username"] == self.username:
            return  # Don't echo back to sender
        await self.send(text_data=json.dumps({
            "type": "typing",
            "username": event["username"],
            "is_typing": event["is_typing"],
        }))
