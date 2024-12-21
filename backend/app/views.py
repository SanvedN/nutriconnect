from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate


# Login View
class LoginView(APIView):
    permission_classes = [AllowAny]  # Public access to the login view

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            return Response({"access": access_token}, status=status.HTTP_200_OK)

        return Response(
            {"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response


# A sample protected view
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get(self, request):
        # This view is protected, so only authenticated users can access it
        return Response({"message": "This is a protected view!"})


# views.py
from rest_framework import generics
from .serializers import UserSerializer
from django.contrib.auth.models import User


class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Profile
from .serializers import ProfileSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request, format=None):
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from .serializers import NutritionRecommendationSerializer
from .utils.nutrition import (
    calculate_nutrition,
)  # Assuming you have this function defined


class NutritionRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        nutrition_data = calculate_nutrition(profile)

        # Update the profile with the nutrition data
        profile.daily_calories = nutrition_data["daily_calories"]
        profile.protein_target = nutrition_data["protein_target"]
        profile.fat_target = nutrition_data["fat_target"]
        profile.carbs_target = nutrition_data["carbs_target"]
        profile.save()

        # Serialize the response
        serializer = NutritionRecommendationSerializer(profile)

        return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from .nutrition_ai import GeminiNutrition
import os


class NutritionPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)

            # Initialize Gemini with API key
            gemini = GeminiNutrition(api_key="AIzaSyBDMYAX4pPgl0XO9wUwIEatNI3EdgHmYeU")

            # Get nutrition plan and exercise routine
            nutrition_plan = gemini.get_nutrition_plan(profile)

            # Save nutrition and exercise plan to profile
            profile.daily_calories = nutrition_plan.get(
                "calories", profile.daily_calories
            )
            profile.protein_target = nutrition_plan.get(
                "protein", profile.protein_target
            )
            profile.carbs_target = nutrition_plan.get("carbs", profile.carbs_target)
            profile.fat_target = nutrition_plan.get("fat", profile.fat_target)
            profile.save()

            return Response(
                {
                    "nutrition_plan": nutrition_plan,
                    "message": "Nutrition and exercise plan generated successfully.",
                }
            )

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class RecipeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)

            # Initialize Gemini with API key
            gemini = GeminiNutrition(api_key="AIzaSyBDMYAX4pPgl0XO9wUwIEatNI3EdgHmYeU")

            # Generate a recipe based on the user's preferences
            recipe = gemini.generate_recipe(profile)

            return Response(
                {"recipe": recipe, "message": "Recipe generated successfully."}
            )

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class UpdateWeightView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = Profile.objects.get(user=request.user)
        new_weight = request.data.get("weight")

        if not new_weight:
            return Response({"error": "Weight value is required"}, status=400)

        # Update weight in profile
        profile.weight = float(new_weight)
        profile.weight_log.append(
            {"weight": new_weight, "timestamp": datetime.now().isoformat()}
        )
        profile.save()

        return Response(
            {
                "message": "Weight updated successfully",
                "current_weight": new_weight,
                "progress": profile.weight_log,
            }
        )


# app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Profile
from .nutrition_ai import GeminiNutrition
import os


class WeeklyPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            gemini = GeminiNutrition(api_key="AIzaSyBDMYAX4pPgl0XO9wUwIEatNI3EdgHmYeU")

            # Generate weekly plans
            plans = gemini.generate_weekly_plans(profile)

            # Update profile with new plans
            profile.weekly_nutrition_plan = plans.get("nutrition_plan", {})
            profile.weekly_workout_plan = plans.get("workout_plan", {})
            profile.save()

            return Response(
                {
                    "weekly_nutrition_plan": profile.weekly_nutrition_plan,
                    "weekly_workout_plan": profile.weekly_workout_plan,
                    "message": "Weekly plans generated successfully",
                }
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """Update specific parts of the weekly plan"""
        try:
            profile = Profile.objects.get(user=request.user)

            if "nutrition_plan" in request.data:
                profile.weekly_nutrition_plan.update(request.data["nutrition_plan"])

            if "workout_plan" in request.data:
                profile.weekly_workout_plan.update(request.data["workout_plan"])

            profile.save()

            return Response(
                {
                    "message": "Weekly plans updated successfully",
                    "weekly_nutrition_plan": profile.weekly_nutrition_plan,
                    "weekly_workout_plan": profile.weekly_workout_plan,
                }
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
