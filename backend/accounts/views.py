from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import LoginSerializer, SignupSerializer, UserSerializer

def token_response(user):
    refresh = RefreshToken.for_user(user)
    return {"user": UserSerializer(user).data, "access": str(refresh.access_token), "refresh": str(refresh)}

class SignupView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SignupSerializer
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_response(serializer.save()), status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_response(serializer.validated_data["user"]))

class LogoutView(APIView):
    def post(self, request):
        token = request.data.get("refresh")
        if token:
            try:
                RefreshToken(token).blacklist()
            except Exception:
                return Response({"detail": "Invalid refresh token."}, status=400)
        return Response(status=status.HTTP_204_NO_CONTENT)

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get("email", "")
        user = User.objects.filter(email__iexact=email).first()
        if user:
            send_mail("StreamSync password reset", f"Reset token: {default_token_generator.make_token(user)}", None, [user.email])
        return Response({"detail": "If that email exists, reset instructions were sent."})

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        try:
            user = User.objects.get(pk=urlsafe_base64_decode(request.data["uid"]).decode())
        except (KeyError, ValueError, User.DoesNotExist):
            return Response({"detail": "Invalid reset request."}, status=400)
        if not default_token_generator.check_token(user, request.data.get("token", "")):
            return Response({"detail": "Invalid reset request."}, status=400)
        try:
            password_validation.validate_password(request.data["password"], user)
        except Exception as exc:
            return Response({"detail": exc.messages}, status=400)
        user.set_password(request.data["password"])
        user.save(update_fields=["password"])
        return Response(status=204)
