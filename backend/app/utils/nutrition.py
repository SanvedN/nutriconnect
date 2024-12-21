# app/utils/nutrition.py
def calculate_nutrition(profile):
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5  # For male
    activity_multiplier = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    tdee = bmr * activity_multiplier.get(profile.activity_level.lower(), 1.2)

    # Macronutrient breakdown
    protein_target = tdee * 0.3 / 4
    fat_target = tdee * 0.3 / 9
    carbs_target = tdee * 0.4 / 4

    return {
        "daily_calories": tdee,
        "protein_target": protein_target,
        "fat_target": fat_target,
        "carbs_target": carbs_target,
    }
