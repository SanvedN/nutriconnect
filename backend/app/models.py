from django.db import models
from django.contrib.auth.models import User

# Define activity level choices
ACTIVITY_LEVEL_CHOICES = [
    ("sedentary", "Sedentary (little to no exercise)"),
    ("light", "Lightly active (light exercise/sports 1-3 days/week)"),
    ("moderate", "Moderately active (moderate exercise/sports 3-5 days/week)"),
    ("active", "Very active (hard exercise/sports 6-7 days a week)"),
]


# Profile model to store additional user information
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # Additional fields for nutrition
    age = models.PositiveIntegerField(default=18)
    height = models.DecimalField(max_digits=5, decimal_places=2, default=150)  # in cm
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=60)  # in kg
    bmi = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )  # BMI value
    activity_level = models.CharField(
        max_length=10, choices=ACTIVITY_LEVEL_CHOICES, default="sedentary"
    )

    def calculate_bmi(self):
        # Formula to calculate BMI: weight(kg) / height(m)^2
        height_in_meters = self.height / 100  # convert cm to meters
        bmi_value = self.weight / (height_in_meters**2)
        self.bmi = round(bmi_value, 2)
        self.save()

    def __str__(self):
        return f"Profile of {self.user.username}"
