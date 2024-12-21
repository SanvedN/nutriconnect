from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)  # Ensure 'bio' field is defined
    phone_number = models.CharField(
        max_length=15, blank=True, null=True
    )  # Add other fields here

    def __str__(self):
        return self.user.username
