from channels.testing.websocket import WebsocketCommunicator
from django.test import TransactionTestCase
from rest_framework.test import APITestCase
from config.asgi import application
from .models import Participant, Room

class RoomFlowTests(APITestCase):
    def create_room(self, privacy="code"):
        response = self.client.post("/api/rooms/", {"name": "Movie night", "privacy": privacy, "source_type": "local", "display_name": "Maya"}, format="json")
        self.assertEqual(response.status_code, 201)
        return response.data

    def as_participant(self, token):
        self.client.credentials(HTTP_X_PARTICIPANT_TOKEN=token)

    def test_create_room_makes_creator_the_host(self):
        data = self.create_room()
        self.assertTrue(data["participant"]["is_host"])
        self.assertTrue(data["participant"]["token"])
        self.assertEqual(data["room"]["host"], "Maya")

    def test_join_by_code_with_only_a_name(self):
        room = self.create_room()["room"]
        response = self.client.post("/api/rooms/join/", {"code": room["code"], "display_name": "Jonah"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["participant"]["is_host"])
        self.assertEqual(Participant.objects.filter(room_id=room["id"]).count(), 2)

    def test_join_requires_a_name(self):
        room = self.create_room()["room"]
        response = self.client.post("/api/rooms/join/", {"code": room["code"]}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_invite_only_room_rejects_code_but_accepts_invitation_once(self):
        data = self.create_room(privacy="invite")
        room = data["room"]
        self.assertEqual(self.client.post("/api/rooms/join/", {"code": room["code"], "display_name": "X"}, format="json").status_code, 403)
        self.as_participant(data["participant"]["token"])
        invitation = self.client.post(f"/api/rooms/{room['id']}/invite/").data["token"]
        self.client.credentials()
        self.assertEqual(self.client.post("/api/rooms/join/", {"invitation": invitation, "display_name": "Priya"}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/rooms/join/", {"invitation": invitation, "display_name": "Alex"}, format="json").status_code, 404)

    def test_room_detail_requires_token_for_that_room(self):
        room = self.create_room()["room"]
        other = self.create_room()["participant"]
        self.assertEqual(self.client.get(f"/api/rooms/{room['id']}/").status_code, 403)
        self.as_participant(other["token"])
        self.assertEqual(self.client.get(f"/api/rooms/{room['id']}/").status_code, 403)

    def test_guest_cannot_end_room_but_host_can(self):
        data = self.create_room()
        room = data["room"]
        guest = self.client.post("/api/rooms/join/", {"code": room["code"], "display_name": "Jonah"}, format="json").data["participant"]
        self.as_participant(guest["token"])
        self.assertEqual(self.client.post(f"/api/rooms/{room['id']}/end/").status_code, 403)
        self.as_participant(data["participant"]["token"])
        self.assertEqual(self.client.post(f"/api/rooms/{room['id']}/end/").status_code, 204)
        self.assertEqual(Room.objects.get(pk=room["id"]).status, Room.Status.ENDED)

    def test_host_can_remove_guest(self):
        data = self.create_room()
        room = data["room"]
        guest = self.client.post("/api/rooms/join/", {"code": room["code"], "display_name": "Jonah"}, format="json").data["participant"]
        self.as_participant(data["participant"]["token"])
        response = self.client.post(f"/api/rooms/{room['id']}/remove-participant/", {"participant_id": guest["id"]}, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Participant.objects.filter(pk=guest["id"]).exists())

class RoomSocketTests(TransactionTestCase):
    def setUp(self):
        self.room = Room.objects.create(name="Movie night", privacy=Room.Privacy.CODE)
        self.host = Participant.objects.create(room=self.room, display_name="Maya", is_host=True)
        self.guest = Participant.objects.create(room=self.room, display_name="Jonah")

    async def connect(self, token):
        communicator = WebsocketCommunicator(application, f"/ws/rooms/{self.room.id}/?token={token}")
        connected, _ = await communicator.connect()
        return communicator, connected

    async def test_unknown_token_is_rejected(self):
        communicator, connected = await self.connect("not-a-real-token")
        self.assertFalse(connected)

    async def test_guest_cannot_control_playback_but_can_chat(self):
        communicator, connected = await self.connect(self.guest.token)
        self.assertTrue(connected)
        self.assertEqual((await communicator.receive_json_from())["type"], "participant.joined")
        await communicator.send_json_to({"type": "playback.pause", "time": 10})
        self.assertEqual((await communicator.receive_json_from())["type"], "error")
        await communicator.send_json_to({"type": "chat.message", "text": "hi"})
        message = await communicator.receive_json_from()
        self.assertEqual(message["message"]["who"], "Jonah")
        await communicator.disconnect()

    async def test_host_playback_reaches_guests(self):
        host, _ = await self.connect(self.host.token)
        await host.receive_json_from()
        guest, _ = await self.connect(self.guest.token)
        await guest.receive_json_from()
        await host.receive_json_from()
        await host.send_json_to({"type": "playback.pause", "time": 42})
        event = await guest.receive_json_from()
        self.assertEqual((event["type"], event["time"]), ("playback.pause", 42))
        await host.disconnect()
        await guest.disconnect()
