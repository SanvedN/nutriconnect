# app/models.py
from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    age = models.IntegerField()
    height = models.FloatField()  # Height in cm
    weight = models.FloatField()  # Weight in kg
    activity_level = models.CharField(
        max_length=50
    )  # Activity level (e.g., Sedentary, Lightly Active, etc.)
    daily_calories = models.FloatField(null=True, blank=True)
    protein_target = models.FloatField(null=True, blank=True)
    fat_target = models.FloatField(null=True, blank=True)
    carbs_target = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    def calculate_nutrition(self):
        # Use Mifflin-St Jeor equation to calculate BMR
        bmr = 10 * self.weight + 6.25 * self.height - 5 * self.age + 5  # For male
        activity_multiplier = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9,
        }
        tdee = bmr * activity_multiplier.get(self.activity_level.lower(), 1.2)

        # Store the daily calories
        self.daily_calories = tdee

        # Macronutrient targets (example: 40% carbs, 30% protein, 30% fat)
        self.protein_target = tdee * 0.3 / 4  # 1g protein = 4 calories
        self.fat_target = tdee * 0.3 / 9  # 1g fat = 9 calories
        self.carbs_target = tdee * 0.4 / 4  # 1g carbs = 4 calories

        self.save()
