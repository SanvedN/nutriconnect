# app/utils/nutrition.py
def calculate_nutrition(profile):
    """Calculate base nutritional needs considering gender"""
    # Mifflin-St Jeor Equation
    if profile.gender == "M":
        bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    else:  # Female or Other
        bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161

    activity_multiplier = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }

    tdee = bmr * activity_multiplier.get(profile.activity_level.lower(), 1.2)

    # Adjust based on weight goal
    weight_difference = profile.target_weight - profile.weight
    if weight_difference < 0:  # Weight loss
        tdee -= 500  # 500 calorie deficit for healthy weight loss
    elif weight_difference > 0:  # Weight gain
        tdee += 500  # 500 calorie surplus for healthy weight gain

    # Macronutrient breakdown
    protein_target = profile.weight * 2.2  # 2.2g per kg of body weight
    fat_target = (tdee * 0.25) / 9  # 25% of calories from fat
    carbs_target = (
        tdee - (protein_target * 4) - (fat_target * 9)
    ) / 4  # Remaining calories from carbs

    return {
        "daily_calories": round(tdee),
        "protein_target": round(protein_target),
        "fat_target": round(fat_target),
        "carbs_target": round(carbs_target),
    }
