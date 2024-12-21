from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile
from django.contrib.auth.models import User


# Signal to create or update the user's profile
@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        # Create the profile with default values
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()
