import json
import google.generativeai as genai
import os
from datetime import datetime


class GeminiNutrition:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-pro")

    def generate_weekly_plans(self, profile) -> dict:
        """Generate comprehensive weekly nutrition and workout plans"""
        prompt = f"""
        As an expert nutritionist and fitness trainer, create a comprehensive weekly nutrition and workout plan for:
        
        User Profile:
        - Gender: {profile.get_gender_display()}
        - Age: {profile.age}
        - Height: {profile.height} cm
        - Current Weight: {profile.weight} kg
        - Target Weight: {profile.target_weight} kg
        - Timeline: {profile.timeline}
        - Activity Level: {profile.activity_level}
        - BMI: {profile.bmi}
        - Meal Preferences: {profile.meal_preference}
        - Daily Calories: {profile.daily_calories}
        - Protein Target: {profile.protein_target}g
        - Carbs Target: {profile.carbs_target}g
        - Fat Target: {profile.fat_target}g

        Generate a structured response with:
        1. A 7-day meal plan with specific meals and portions
        2. A 7-day workout plan with specific exercises, sets, reps, and rest periods
        3. Daily nutritional breakdown
        4. Weekly progress targets

        Format as JSON with the following structure:
        {{
            "nutrition_plan": {{
                "monday": {{
                    "breakfast": {{"meal": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}},
                    "lunch": {{"meal": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}},
                    "dinner": {{"meal": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}},
                    "snacks": [{{"meal": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}}]
                }},
                // ... other days
            }},
            "workout_plan": {{
                "monday": {{
                    "focus": "",
                    "exercises": [
                        {{
                            "name": "",
                            "sets": 0,
                            "reps": 0,
                            "rest": ""
                        }}
                    ]
                }},
                // ... other days
            }}
        }}
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
