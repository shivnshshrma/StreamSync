from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .auth import participant_from_request
from .models import Invitation, Participant, Room
from videos.models import Video
from .serializers import CreateRoomSerializer, JoinSerializer, RoomSerializer, SourceSerializer, session_response

def not_in_room():
    return Response({"detail": "You are not in this room."}, status=403)

def host_only(detail):
    return Response({"detail": detail}, status=403)

class RoomCreateView(APIView):
    @transaction.atomic
    def post(self, request):
        serializer = CreateRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        display_name = serializer.validated_data.pop("display_name")
        room = serializer.save()
        host = Participant.objects.create(room=room, display_name=display_name, is_host=True)
        return Response(session_response(host), status=status.HTTP_201_CREATED)

class JoinRoomView(APIView):
    @transaction.atomic
    def post(self, request):
        serializer = JoinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data.get("invitation"):
            invitation = get_object_or_404(
                Invitation.objects.select_for_update().select_related("room"),
                token=data["invitation"],
                room__status=Room.Status.ACTIVE,
                used_at__isnull=True,
                expires_at__gt=timezone.now(),
            )
            invitation.used_at = timezone.now()
            invitation.save(update_fields=["used_at"])
            room = invitation.room
        else:
            room = get_object_or_404(Room, code=data["code"].upper(), status=Room.Status.ACTIVE)
            if room.privacy == Room.Privacy.INVITE:
                return Response({"detail": "This room requires an invitation."}, status=403)
        participant = Participant.objects.create(room=room, display_name=data["display_name"])
        return Response(session_response(participant))

class RoomDetailView(APIView):
    def get(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant:
            return not_in_room()
        return Response(RoomSerializer(participant.room).data)

class LeaveRoomView(APIView):
    def post(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant:
            return not_in_room()
        if participant.is_host:
            return Response({"detail": "The host must end the room instead."}, status=400)
        participant.delete()
        return Response(status=204)

class InviteView(APIView):
    def post(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant or not participant.is_host:
            return host_only("Only the host can create invitations.")
        invitation = Invitation.objects.create(
            room=participant.room, invited_by=participant, expires_at=timezone.now() + timedelta(days=2)
        )
        return Response({"token": invitation.token, "expires_at": invitation.expires_at})

class RemoveParticipantView(APIView):
    def post(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant or not participant.is_host:
            return host_only("Only the host can remove participants.")
        target = get_object_or_404(Participant, room_id=room_id, pk=request.data.get("participant_id"))
        if target.is_host:
            return Response({"detail": "The host cannot be removed."}, status=400)
        target.delete()
        return Response(status=204)

class EndRoomView(APIView):
    def post(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant or not participant.is_host:
            return host_only("Only the host can end the room.")
        room = participant.room
        room.status = Room.Status.ENDED
        room.save(update_fields=["status", "last_active"])
        return Response(status=204)

class SourceView(APIView):
    def patch(self, request, room_id):
        participant = participant_from_request(request, room_id)
        if not participant or not participant.is_host:
            return host_only("Only the host can change the source.")
        serializer = SourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room = participant.room
        room.source_type = serializer.validated_data["source_type"]
        video_id = serializer.validated_data.get("video")
        room.video = get_object_or_404(Video, pk=video_id) if video_id else None
        room.save(update_fields=["source_type", "video", "last_active"])
        return Response(RoomSerializer(room).data)
