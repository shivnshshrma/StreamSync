import secrets
import string
import uuid
from django.conf import settings
from django.db import models

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
def room_code():
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
def invitation_token():
    return secrets.token_urlsafe(32)

class Room(models.Model):
    class Privacy(models.TextChoices):
        INVITE = "invite", "Invite only"
        CODE = "code", "Room code"
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ENDED = "ended", "Ended"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=6, unique=True, default=room_code)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hosted_rooms")
    privacy = models.CharField(max_length=10, choices=Privacy.choices, default=Privacy.INVITE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    video = models.ForeignKey("videos.Video", null=True, blank=True, on_delete=models.SET_NULL, related_name="rooms")
    source_type = models.CharField(max_length=10, choices=[("uploaded", "Uploaded"), ("local", "Local")], default="uploaded")
    playback_state = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

class RoomMember(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="room_memberships")
    joined_at = models.DateTimeField(auto_now_add=True)
    is_host = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["room", "user"], name="unique_room_member")]

class Invitation(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="invitations")
    token = models.CharField(max_length=64, unique=True, default=invitation_token)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
