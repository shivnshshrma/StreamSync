from .models import Participant, Room

TOKEN_HEADER = "HTTP_X_PARTICIPANT_TOKEN"

def find_participant(token, room_id):
    """Return the participant that owns this token in an active room, or None."""
    if not token:
        return None
    return (
        Participant.objects.select_related("room")
        .filter(token=token, room_id=room_id, room__status=Room.Status.ACTIVE)
        .first()
    )

def participant_from_request(request, room_id):
    return find_participant(request.META.get(TOKEN_HEADER), room_id)
