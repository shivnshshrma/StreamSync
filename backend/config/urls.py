from django.urls import include, path

urlpatterns = [
    path("api/videos/", include("videos.urls")),
    path("api/rooms/", include("rooms.urls")),
]
