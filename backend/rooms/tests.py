from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User
from .models import Room, RoomMember

class RoomAccessTests(APITestCase):
    def setUp(self):
        self.host = User.objects.create_user(email="host@example.com", password="password123", display_name="Host")
        self.guest = User.objects.create_user(email="guest@example.com", password="password123", display_name="Guest")
        self.other = User.objects.create_user(email="other@example.com", password="password123", display_name="Other")
        self.room = Room.objects.create(name="Private room", host=self.host, privacy=Room.Privacy.CODE)
        RoomMember.objects.create(room=self.room, user=self.host, is_host=True)

    def auth(self, user):
        response = self.client.post("/api/auth/login/", {"email": user.email, "password": "password123"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_signup_and_me(self):
        response = self.client.post("/api/auth/signup/", {"name": "New User", "email": "new@example.com", "password": "password123"})
        self.assertEqual(response.status_code, 201)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").data["email"], "new@example.com")

    def test_code_join_adds_membership(self):
        self.auth(self.guest)
        response = self.client.post("/api/rooms/join/", {"code": self.room.code})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(RoomMember.objects.filter(room=self.room, user=self.guest).exists())

    def test_room_detail_requires_membership(self):
        self.auth(self.other)
        self.assertEqual(self.client.get(f"/api/rooms/{self.room.id}/").status_code, 403)

    def test_non_host_cannot_end_room(self):
        RoomMember.objects.create(room=self.room, user=self.guest)
        self.auth(self.guest)
        self.assertEqual(self.client.post(f"/api/rooms/{self.room.id}/end/").status_code, 403)
