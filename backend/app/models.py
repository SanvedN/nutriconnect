# app/models.py
from django.db import models
from django.contrib.auth.models import User
import json


class Profile(models.Model):
    GENDER_CHOICES = [("M", "Male"), ("F", "Female"), ("O", "Other")]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default="M")
    age = models.PositiveIntegerField(default=0)
    height = models.FloatField(default=0.0)
    weight = models.FloatField(default=0.0)
    target_weight = models.FloatField(default=0.0)
    timeline = models.CharField(max_length=255, default="")
    activity_level = models.CharField(
        max_length=50,
        choices=[
            ("sedentary", "Sedentary"),
            ("light", "Light"),
            ("moderate", "Moderate"),
            ("active", "Active"),
        ],
        default="sedentary",
    )
    bmi = models.FloatField(default=0.0)
    meal_preference = models.CharField(max_length=255, default="")
    weight_log = models.JSONField(default=list)
    daily_calories = models.FloatField(default=0.0)
    protein_target = models.FloatField(default=0.0)
    fat_target = models.FloatField(default=0.0)
    carbs_target = models.FloatField(default=0.0)
    weekly_nutrition_plan = models.JSONField(default=dict)
    weekly_workout_plan = models.JSONField(default=dict)
    progress_report = models.JSONField(default=dict)

    def __str__(self):
        return self.user.username
