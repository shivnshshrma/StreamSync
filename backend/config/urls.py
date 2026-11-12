from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import LoginView, LogoutView, MeView, SignupView, ForgotPasswordView, ResetPasswordView

urlpatterns = [
    path("api/auth/signup/", SignupView.as_view()),
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/logout/", LogoutView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/forgot-password/", ForgotPasswordView.as_view()),
    path("api/auth/reset-password/", ResetPasswordView.as_view()),
    path("api/videos/", include("videos.urls")),
    path("api/rooms/", include("rooms.urls")),
]
