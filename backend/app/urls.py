from django.urls import path
from .views import LoginView, ProtectedView, RegisterUserView, ProfileView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("protected/", ProtectedView.as_view(), name="protected"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
]