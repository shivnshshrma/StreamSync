from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Invitation, Room, RoomMember
from .serializers import CreateRoomSerializer, JoinSerializer, MemberSerializer, RoomSerializer, SourceSerializer
from videos.models import Video

class RoomAccessMixin:
    def get_room(self):
        room = get_object_or_404(Room, pk=self.kwargs["room_id"], status=Room.Status.ACTIVE)
        if not RoomMember.objects.filter(room=room, user=self.request.user).exists():
            return None
        return room

class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    def get_queryset(self):
        return Room.objects.filter(members__user=self.request.user).distinct().prefetch_related("members__user")
    @transaction.atomic
    def perform_create(self, serializer):
        room = serializer.save(host=self.request.user)
        RoomMember.objects.create(room=room, user=self.request.user, is_host=True)

class RoomDetailView(RoomAccessMixin, APIView):
    def get(self, request, room_id):
        room = self.get_room()
        if not room:
            return Response({"detail": "You are not a member of this room."}, status=403)
        return Response(RoomSerializer(room, context={"request": request}).data)

class JoinRoomView(APIView):
    def post(self, request):
        serializer = JoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = None
        if serializer.validated_data.get("invitation"):
            invitation = get_object_or_404(
                Invitation.objects.select_related("room"),
                token=serializer.validated_data["invitation"],
                room__status=Room.Status.ACTIVE,
                used_at__isnull=True,
                expires_at__gt=timezone.now(),
            )
            room = invitation.room
            invitation.used_at = timezone.now()
            invitation.save(update_fields=["used_at"])
        else:
            room = get_object_or_404(Room, code=serializer.validated_data["code"].upper(), status=Room.Status.ACTIVE)
            if room.privacy == Room.Privacy.INVITE and room.host_id != request.user.id:
                return Response({"detail": "This room requires an invitation."}, status=403)
        RoomMember.objects.get_or_create(room=room, user=request.user)
        return Response(RoomSerializer(room, context={"request": request}).data)

class LeaveRoomView(RoomAccessMixin, APIView):
    def post(self, request, room_id):
        room = self.get_room()
        if not room:
            return Response({"detail": "You are not a member of this room."}, status=403)
        if room.host_id == request.user.id:
            return Response({"detail": "The host must end the room instead."}, status=400)
        RoomMember.objects.filter(room=room, user=request.user).delete()
        return Response(status=204)

class InviteView(RoomAccessMixin, APIView):
    def post(self, request, room_id):
        room = self.get_room()
        if not room or room.host_id != request.user.id:
            return Response({"detail": "Only the host can create invitations."}, status=403)
        invitation = Invitation.objects.create(room=room, invited_by=request.user, expires_at=timezone.now() + timedelta(days=2))
        return Response({"token": invitation.token, "expires_at": invitation.expires_at})

class RemoveMemberView(RoomAccessMixin, APIView):
    def post(self, request, room_id):
        room = self.get_room()
        if not room or room.host_id != request.user.id:
            return Response({"detail": "Only the host can remove participants."}, status=403)
        member = get_object_or_404(RoomMember, room=room, user_id=request.data.get("user_id"))
        if member.user_id == room.host_id:
            return Response({"detail": "The host cannot be removed."}, status=400)
        member.delete()
        return Response(status=204)

class EndRoomView(RoomAccessMixin, APIView):
    def post(self, request, room_id):
        room = self.get_room()
        if not room or room.host_id != request.user.id:
            return Response({"detail": "Only the host can end the room."}, status=403)
        room.status = Room.Status.ENDED
        room.save(update_fields=["status", "last_active"])
        return Response(status=204)

class SourceView(RoomAccessMixin, APIView):
    def patch(self, request, room_id):
        room = self.get_room()
        if not room or room.host_id != request.user.id:
            return Response({"detail": "Only the host can change the source."}, status=403)
        serializer = SourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        video = None
        if serializer.validated_data.get("video"):
            video = get_object_or_404(Video, pk=serializer.validated_data["video"], owner=request.user)
        room.source_type = serializer.validated_data["source_type"]
        room.video = video
        room.save(update_fields=["source_type", "video", "last_active"])
        return Response(RoomSerializer(room, context={"request": request}).data)
