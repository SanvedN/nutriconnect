import requests
from datetime import datetime

# Base URL of the backend
BASE_URL = "http://127.0.0.1:8000/api/"


def get_jwt_token(username, password):
    """Get JWT token for authentication"""
    login_url = f"{BASE_URL}login/"
    data = {"username": username, "password": password}

    response = requests.post(login_url, data=data)
    print("Login response:", response.json())

    if response.status_code == 200:
        print("Login successful!")
        token = response.json().get("access")
        print("JWT Token:", token)
        return token
    else:
        print(f"Login failed: {response.text}")
        return None


def register_user(username, email, password):
    """Register a new user"""
    register_url = f"{BASE_URL}register/"
    data = {"username": username, "email": email, "password": password}

    response = requests.post(register_url, data=data)
    print("Registration response:", response.json())
    return response.status_code == 201


def update_profile(token, profile_data):
    """Update user profile information"""
    profile_url = f"{BASE_URL}profile/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(profile_url, headers=headers, json=profile_data)

    if response.status_code == 200:
        print("Profile Updated:", response.json())
    else:
        print(f"Failed to update profile: {response.text}")


def get_profile(token):
    """Get user profile information"""
    profile_url = f"{BASE_URL}profile/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(profile_url, headers=headers)

    if response.status_code == 200:
        print("Profile Data:", response.json())
        return response.json()
    else:
        print(f"Failed to fetch profile: {response.text}")
        return None


def get_nutrition_recommendations(token):
    """Get basic nutrition recommendations"""
    nutrition_url = f"{BASE_URL}nutrition/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(nutrition_url, headers=headers)

    if response.status_code == 200:
        print("Nutrition Recommendations:", response.json())
        return response.json()
    else:
        print(f"Failed to fetch nutrition recommendations: {response.text}")
        return None


def get_weekly_plan(token):
    """Get weekly nutrition and workout plan"""
    weekly_plan_url = f"{BASE_URL}weekly-plan/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(weekly_plan_url, headers=headers)

    if response.status_code == 200:
        print("Weekly Plan:", response.json())
        return response.json()
    else:
        print(f"Failed to fetch weekly plan: {response.text}")
        return None


def update_weekly_plan(token, nutrition_plan=None, workout_plan=None):
    """Update specific parts of the weekly plan"""
    weekly_plan_url = f"{BASE_URL}weekly-plan/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {}

    if nutrition_plan:
        data["nutrition_plan"] = nutrition_plan
    if workout_plan:
        data["workout_plan"] = workout_plan

    response = requests.post(weekly_plan_url, headers=headers, json=data)

    if response.status_code == 200:
        print("Weekly Plan Updated:", response.json())
        return response.json()
    else:
        print(f"Failed to update weekly plan: {response.text}")
        return None


def get_recipes(token):
    """Get nutrition-based recipes"""
    recipes_url = f"{BASE_URL}nutrition/recipe/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(recipes_url, headers=headers)

    if response.status_code == 200:
        print("Recipes:", response.json())
        return response.json()
    else:
        print(f"Failed to fetch recipes: {response.text}")
        return None


def update_weight(token, weight):
    """Update user weight and get new recommendations"""
    update_weight_url = f"{BASE_URL}nutrition/update-weight/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"weight": weight}
    response = requests.post(update_weight_url, headers=headers, data=data)

    if response.status_code == 200:
        print("Weight Updated:", response.json())
        return response.json()
    else:
        print(f"Failed to update weight: {response.text}")
        return None


def test_all_functionality():
    """Test all API endpoints"""
    # Test user registration (optional, comment out if not needed)
    username = "testuser"
    email = "testuser@example.com"
    password = "testpassword123"

    print("\n1. Testing log...")
    register_user(username, email, password)

    print("\n2. Testing Login...")
    token = get_jwt_token(username, password)

    if token:
        print("\n3. Testing Profile Update...")
        profile_data = {
            "gender": "M",
            "age": 30,
            "height": 175.0,
            "weight": 70.0,
            "target_weight": 65.0,
            "timeline": "3 months",
            "activity_level": "moderate",
            "meal_preference": "balanced",
        }
        update_profile(token, profile_data)

        print("\n4. Testing Profile Retrieval...")
        profile = get_profile(token)

        print("\n5. Testing Nutrition Recommendations...")
        nutrition = get_nutrition_recommendations(token)

        print("\n6. Testing Weekly Plan Generation...")
        weekly_plan = get_weekly_plan(token)

        print("\n7. Testing Recipe Generation...")
        recipes = get_recipes(token)

        print("\n8. Testing Weight Update...")
        weight_update = update_weight(token, 69.5)

        print("\n9. Testing Weekly Plan Update...")
        if weekly_plan:
            # Example of updating just one day's nutrition
            nutrition_update = {
                "monday": {
                    "breakfast": {
                        "meal": "Modified breakfast",
                        "calories": 500,
                        "protein": 30,
                        "carbs": 60,
                        "fat": 20,
                    }
                }
            }
            update_weekly_plan(token, nutrition_plan=nutrition_update)


if __name__ == "__main__":
    print("Starting API Testing Script...")
    test_all_functionality()
