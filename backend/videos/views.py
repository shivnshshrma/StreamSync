from django.core import signing
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from .models import Video
from .serializers import VideoSerializer

# There are no accounts: the library is shared by everyone who can reach this server.
class VideoListCreateView(generics.ListCreateAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

class VideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

class PlaybackURLView(generics.GenericAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    def post(self, request, pk):
        video = get_object_or_404(self.get_queryset(), pk=pk)
        return Response({"url": self.get_serializer(video).data["playback_url"]})

class PlaybackStreamView(generics.GenericAPIView):
    def get(self, request, pk, token):
        try:
            payload = signing.loads(token, salt="streamsync-playback", max_age=300)
        except signing.BadSignature:
            return Response({"detail": "Playback URL is invalid or expired."}, status=403)
        if payload.get("video") != str(pk):
            return Response({"detail": "Playback URL is invalid."}, status=403)
        video = get_object_or_404(Video, pk=pk)
        response = FileResponse(video.file.open("rb"), content_type="video/mp4")
        response["Content-Disposition"] = f'inline; filename="{video.id}.mp4"'
        return response
