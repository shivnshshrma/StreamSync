from django.urls import path
from .views import EndRoomView, InviteView, JoinRoomView, LeaveRoomView, RemoveMemberView, RoomDetailView, RoomListCreateView, SourceView
urlpatterns = [
    path("", RoomListCreateView.as_view()),
    path("join/", JoinRoomView.as_view()),
    path("<uuid:room_id>/", RoomDetailView.as_view()),
    path("<uuid:room_id>/leave/", LeaveRoomView.as_view()),
    path("<uuid:room_id>/invite/", InviteView.as_view()),
    path("<uuid:room_id>/remove-member/", RemoveMemberView.as_view()),
    path("<uuid:room_id>/end/", EndRoomView.as_view()),
    path("<uuid:room_id>/source/", SourceView.as_view()),
]
