# nutriconnect_backend/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("app.urls")),  # Ensure app URLs are correctly included here
]
