from django.urls import path
from .views import VideoDetailView, VideoListCreateView, PlaybackURLView, PlaybackStreamView
urlpatterns = [
    path("", VideoListCreateView.as_view()),
    path("<uuid:pk>/", VideoDetailView.as_view()),
    path("<uuid:pk>/playback-url/", PlaybackURLView.as_view()),
    path("<uuid:pk>/playback/<str:token>/", PlaybackStreamView.as_view()),
]
