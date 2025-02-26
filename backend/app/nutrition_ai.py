import json
import google.generativeai as genai
import os
from datetime import datetime


class GeminiNutrition:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-pro")

    def generate_weekly_plans(self, profile) -> dict:
        """Generate comprehensive weekly nutrition and workout plans"""
        prompt = f"""
        Create a comprehensive weekly plan for the following user:

        User Details:
        - Gender: {profile.get_gender_display()}
        - Age: {profile.age}
        - Height: {profile.height} cm
        - Weight: {profile.weight} kg
        - Target Weight: {profile.target_weight} kg
        - Activity Level: {profile.activity_level}
        - Meal Preferences: {profile.meal_preference}
        - Daily Calories: {profile.daily_calories} kcal
        - Macronutrient Targets: Protein {profile.protein_target}g, Carbs {profile.carbs_target}g, Fat {profile.fat_target}g

        Generate a JSON response structured as:
        {{
            "nutrition_plan": {{
                "monday": {{
                    "breakfast": {{"meal": "Sample Meal", "calories": 300, "protein": 10, "carbs": 40, "fat": 10}},
                    "lunch": {{"meal": "Sample Meal", "calories": 500, "protein": 30, "carbs": 50, "fat": 15}},
                    "dinner": {{"meal": "Sample Meal", "calories": 400, "protein": 25, "carbs": 45, "fat": 10}},
                    "snacks": [{{"meal": "Snack", "calories": 150, "protein": 5, "carbs": 20, "fat": 5}}]
                }},
                // Repeat for all days
            }},
            "workout_plan": {{
                "monday": {{
                    "focus": "Upper Body",
                    "exercises": [
                        {{"name": "Push-ups", "sets": 3, "reps": 15, "rest": "1 min"}},
                        {{"name": "Pull-ups", "sets": 3, "reps": 10, "rest": "2 min"}}
                    ]
                }},
                // Repeat for all days
            }}
        }}

        Ensure that the meal and workout plans are distinct and follow the structure provided.
        """

        response = self.model.generate_content(prompt)
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return self._format_unstructured_response(response.text)

    def _format_unstructured_response(self, text):
        """Fallback formatter for unstructured responses"""
        return {
            "nutrition_plan": {
                "error": "Could not parse structured plan",
                "raw_response": text,
            },
            "workout_plan": {
                "error": "Could not parse structured plan",
                "raw_response": text,
            },
        }

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
