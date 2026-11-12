from rest_framework.test import APITestCase
from .models import User

class AuthTests(APITestCase):
    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(email="same@example.com", password="password123", display_name="One")
        response = self.client.post("/api/auth/signup/", {"name": "Two", "email": "same@example.com", "password": "password123"})
        self.assertEqual(response.status_code, 400)
