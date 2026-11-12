import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .models import Room, RoomMember
from chat.models import ChatMessage

class RoomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"room_{self.room_id}"
        user = self.scope.get("user")
        if not user or user.is_anonymous or not await self.is_member(user.id):
            await self.close(code=4403)
            return
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        state = await self.get_state()
        if state:
            await self.send_json({"type": "room.state", "state": state})
        await self.broadcast({"type": "participant.joined", "user_id": user.id, "name": user.display_name})

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            user = self.scope.get("user")
            if user and not user.is_anonymous:
                await self.broadcast({"type": "participant.left", "user_id": user.id})

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
            if event_type.startswith("playback.") and not await self.is_host(self.scope["user"].id):
                return await self.send_json({"type": "error", "detail": "Only the host can control playback."})
            if event_type.startswith("playback."):
                await self.save_playback(content)
            await self.broadcast({**content, "sender_id": self.scope["user"].id})
            return
        await self.send_json({"type": "error", "detail": "Unsupported event type."})

    async def broadcast(self, payload):
        await self.channel_layer.group_send(self.group_name, {"type": "room.event", "payload": payload})

    async def room_event(self, event):
        await self.send_json(event["payload"])

    @database_sync_to_async
    def is_member(self, user_id):
        return RoomMember.objects.filter(room_id=self.room_id, user_id=user_id, room__status=Room.Status.ACTIVE).exists()

    @database_sync_to_async
    def is_host(self, user_id):
        return Room.objects.filter(id=self.room_id, host_id=user_id, status=Room.Status.ACTIVE).exists()

    @database_sync_to_async
    def get_state(self):
        return Room.objects.filter(id=self.room_id).values_list("playback_state", flat=True).first()

    @database_sync_to_async
    def save_playback(self, payload):
        Room.objects.filter(id=self.room_id).update(playback_state=payload)

    @database_sync_to_async
    def save_message(self, text):
        message = ChatMessage.objects.create(room_id=self.room_id, sender=self.scope["user"], text=text)
        return {"id": message.id, "who": message.sender.display_name, "text": message.text, "created_at": message.created_at.isoformat()}
