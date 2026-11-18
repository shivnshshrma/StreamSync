from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chat.models import ChatMessage
from .auth import find_participant
from .models import Room

class RoomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"room_{self.room_id}"
        token = parse_qs(self.scope.get("query_string", b"").decode()).get("token", [None])[0]
        self.participant = await database_sync_to_async(find_participant)(token, self.room_id)
        if not self.participant:
            await self.close(code=4403)
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        state = await self.get_state()
        if state:
            await self.send_json({"type": "room.state", "state": state})
        await self.broadcast({"type": "participant.joined", "participant_id": self.participant.id, "name": self.participant.display_name})

    async def disconnect(self, close_code):
        # Rejected connections never joined the group and have no participant.
        if getattr(self, "participant", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.broadcast({"type": "participant.left", "participant_id": self.participant.id})

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type", "")
        if event_type == "chat.message":
            text = str(content.get("text", "")).strip()
            if not text or len(text) > 2000:
                return await self.send_json({"type": "error", "detail": "Messages must be 1-2000 characters."})
            message = await self.save_message(text)
            await self.broadcast({"type": "chat.message", "message": message})
            return
        if event_type.startswith(("playback.", "webrtc.")):
            if event_type.startswith("playback.") and not self.participant.is_host:
                return await self.send_json({"type": "error", "detail": "Only the host can control playback."})
            if event_type.startswith("playback."):
                await self.save_playback(content)
            await self.broadcast({**content, "sender_id": self.participant.id})
            return
        await self.send_json({"type": "error", "detail": "Unsupported event type."})

    async def broadcast(self, payload):
        await self.channel_layer.group_send(self.group_name, {"type": "room.event", "payload": payload})

    async def room_event(self, event):
        await self.send_json(event["payload"])

    @database_sync_to_async
    def get_state(self):
        return Room.objects.filter(id=self.room_id).values_list("playback_state", flat=True).first()

    @database_sync_to_async
    def save_playback(self, payload):
        Room.objects.filter(id=self.room_id).update(playback_state=payload)

    @database_sync_to_async
    def save_message(self, text):
        message = ChatMessage.objects.create(room_id=self.room_id, sender=self.participant, text=text)
        return {"id": message.id, "who": self.participant.display_name, "text": message.text, "created_at": message.created_at.isoformat()}
