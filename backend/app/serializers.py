# app/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "user",
            "gender",
            "age",
            "height",
            "weight",
            "target_weight",
            "timeline",
            "activity_level",
            "meal_preference",
            "daily_calories",
            "protein_target",
            "fat_target",
            "carbs_target",
            "weekly_nutrition_plan",
            "weekly_workout_plan",
        ]


class NutritionRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["daily_calories", "protein_target", "fat_target", "carbs_target"]
        read_only_fields = fields


class WeeklyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["weekly_nutrition_plan", "weekly_workout_plan"]
        read_only_fields = fields
