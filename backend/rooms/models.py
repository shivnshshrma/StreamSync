import secrets
import uuid
from django.db import models

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
def room_code():
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
def secret_token():
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
    privacy = models.CharField(max_length=10, choices=Privacy.choices, default=Privacy.INVITE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    video = models.ForeignKey("videos.Video", null=True, blank=True, on_delete=models.SET_NULL, related_name="rooms")
    source_type = models.CharField(max_length=10, choices=[("uploaded", "Uploaded"), ("local", "Local")], default="uploaded")
    playback_state = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    @property
    def host(self):
        return self.participants.filter(is_host=True).first()

class Participant(models.Model):
    """A person in one room. There are no accounts: the secret token is the identity."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="participants")
    display_name = models.CharField(max_length=100)
    token = models.CharField(max_length=64, unique=True, default=secret_token)
    is_host = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["joined_at"]

class Invitation(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="invitations")
    token = models.CharField(max_length=64, unique=True, default=secret_token)
    invited_by = models.ForeignKey(Participant, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
