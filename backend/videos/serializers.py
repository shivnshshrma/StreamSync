from django.conf import settings
from django.core import signing
from rest_framework import serializers
from .models import Video

class VideoSerializer(serializers.ModelSerializer):
    playback_url = serializers.SerializerMethodField()
    class Meta:
        model = Video
        fields = ("id", "title", "description", "duration", "year", "thumbnail", "playback_url", "created_at")
        read_only_fields = ("id", "playback_url", "created_at")
    def get_playback_url(self, obj):
        request = self.context.get("request")
        if not request or not obj.file:
            return None
        token = signing.dumps({"video": str(obj.pk)}, salt="streamsync-playback")
        return request.build_absolute_uri(f"/api/videos/{obj.pk}/playback/{token}/")
    def validate_file(self, value):
        if value.size > settings.VIDEO_MAX_BYTES:
            raise serializers.ValidationError("Video exceeds the maximum allowed size.")
        if not value.content_type or not value.content_type.startswith("video/"):
            raise serializers.ValidationError("Only video files are accepted.")
        return value
