from django.utils import timezone
from rest_framework import serializers
from .models import Room, RoomMember

class MemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.display_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = RoomMember
        fields = ("user", "name", "email", "is_host", "joined_at")

class RoomSerializer(serializers.ModelSerializer):
    host = serializers.CharField(source="host.display_name", read_only=True)
    participants = serializers.SerializerMethodField()
    video_id = serializers.UUIDField(source="video.id", read_only=True, allow_null=True)
    class Meta:
        model = Room
        fields = ("id", "name", "code", "host", "privacy", "status", "video_id", "source_type", "participants", "created_at", "last_active")
        read_only_fields = ("id", "code", "host", "status", "participants", "created_at", "last_active")
    def get_participants(self, obj):
        return MemberSerializer(obj.members.select_related("user"), many=True).data

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ("name", "privacy", "video", "source_type")
    def validate_video(self, value):
        if value and value.owner_id != self.context["request"].user.id:
            raise serializers.ValidationError("You can only use videos you own.")
        return value

class JoinSerializer(serializers.Serializer):
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
        video = attrs.get("video")
        if attrs["source_type"] == "uploaded" and not video:
            raise serializers.ValidationError({"video": "An uploaded source requires a video."})
        return attrs
