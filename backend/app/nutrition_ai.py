import google.generativeai as genai
import os
from datetime import datetime


class GeminiNutrition:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-pro")

    def get_nutrition_plan(self, profile) -> dict:
        """
        Generate a nutrition and exercise plan based on user's profile.
        """
        prompt = f"""
        You are an expert nutritionist and fitness planner. Create a detailed and personalized nutrition and exercise plan for a user based on their profile:

        User Profile:
        - Age: {profile.age}
        - Height: {profile.height} cm
        - Current Weight: {profile.weight} kg
        - Target Weight: {profile.target_weight} kg
        - Timeline: {profile.timeline}
        - Activity Level: {profile.activity_level}
        - BMI: {profile.bmi}
        - Meal Preferences: {profile.meal_preference}

        The plan should include:
        1. Daily caloric intake
        2. Macronutrient breakdown (protein, carbs, fat in grams)
        3. Exercise routine for the week
        4. Weekly progress targets

        Format the nutritional and exercise data as follows:
        METRIC:CALORIES:<calories_value>
        METRIC:PROTEIN:<protein_value>
        METRIC:CARBS:<carbs_value>
        METRIC:FAT:<fat_value>
        METRIC:EXERCISE:<exercise_plan>
        """

        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def _parse_response(self, response_text: str) -> dict:
        """Parse Gemini response and extract the relevant metrics"""
        metrics = {}
        for line in response_text.split("\n"):
            if line.startswith("METRIC:"):
                _, key, value = line.split(":")
                metrics[key.lower()] = value.strip()

        return metrics

    def generate_recipe(self, profile) -> str:
        """
        Generate a quick recipe based on user's meal preferences and nutritional needs.
        """
        prompt = f"""
        Based on the following user's preferences and dietary requirements, create a quick recipe:
        User Preferences: {profile.meal_preference}
        Daily Caloric Intake: {profile.daily_calories}
        Protein Target: {profile.protein_target}g
        Carbs Target: {profile.carbs_target}g
        Fat Target: {profile.fat_target}g

        Provide the recipe as ingredients, steps, and nutritional info.
        """

        response = self.model.generate_content(prompt)
        return response.text
