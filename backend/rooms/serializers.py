from rest_framework import serializers
from .models import Participant, Room

class ParticipantSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="display_name", read_only=True)
    class Meta:
        model = Participant
        fields = ("id", "name", "is_host", "joined_at")

class RoomSerializer(serializers.ModelSerializer):
    host = serializers.SerializerMethodField()
    participants = ParticipantSerializer(many=True, read_only=True)
    video_id = serializers.UUIDField(source="video.id", read_only=True, allow_null=True)
    class Meta:
        model = Room
        fields = ("id", "name", "code", "host", "privacy", "status", "video_id", "source_type", "participants", "created_at", "last_active")
        read_only_fields = fields
    def get_host(self, obj):
        host = obj.host
        return host.display_name if host else None

def session_response(participant):
    """Room details plus the caller's own token. Only the caller ever sees the token."""
    return {
        "room": RoomSerializer(participant.room).data,
        "participant": {**ParticipantSerializer(participant).data, "token": participant.token},
    }

def DisplayName():
    return serializers.CharField(min_length=1, max_length=100, trim_whitespace=True)

class CreateRoomSerializer(serializers.ModelSerializer):
    display_name = DisplayName()
    class Meta:
        model = Room
        fields = ("name", "privacy", "video", "source_type", "display_name")

class JoinSerializer(serializers.Serializer):
    display_name = DisplayName()
    code = serializers.CharField(min_length=6, max_length=6, required=False)
    invitation = serializers.CharField(required=False)
    def validate(self, attrs):
        if not attrs.get("code") and not attrs.get("invitation"):
            raise serializers.ValidationError("Provide a room code or invitation token.")
        return attrs

class SourceSerializer(serializers.Serializer):
    source_type = serializers.ChoiceField(choices=["uploaded", "local"])
    video = serializers.UUIDField(required=False, allow_null=True)
    def validate(self, attrs):
        if attrs["source_type"] == "uploaded" and not attrs.get("video"):
            raise serializers.ValidationError({"video": "An uploaded source requires a video."})
        return attrs
