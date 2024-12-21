import requests

# Base URL of the backend
BASE_URL = "http://127.0.0.1:8000/api/"


# Function to get the JWT token
def get_jwt_token(username, password):
    login_url = f"{BASE_URL}login/"
    data = {"username": username, "password": password}

    response = requests.post(login_url, data=data)

    # Print the response for debugging
    print("Login response:", response.json())

    if response.status_code == 200:
        print("Login successful!")
        # Extract the JWT token from the response
        token = response.json().get("access")
        print("JWT Token:", token)
        return token
    else:
        print(f"Login failed: {response.text}")
        return None


# Function to get profile information
def get_profile(token):
    profile_url = f"{BASE_URL}profile/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(profile_url, headers=headers)

    if response.status_code == 200:
        print("Profile Data:", response.json())
    else:
        print(f"Failed to fetch profile: {response.text}")


# Function to get nutrition recommendations
def get_nutrition_recommendations(token):
    nutrition_url = f"{BASE_URL}nutrition/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(nutrition_url, headers=headers)

    if response.status_code == 200:
        print("Nutrition Recommendations:", response.json())
    else:
        print(f"Failed to fetch nutrition recommendations: {response.text}")


# Function to get the nutrition plan
def get_nutrition_plan(token):
    nutrition_plan_url = f"{BASE_URL}nutrition/plan/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(nutrition_plan_url, headers=headers)

    if response.status_code == 200:
        print("Nutrition Plan:", response.json())
    else:
        print(f"Failed to fetch nutrition plan: {response.text}")


# Function to get nutrition-based recipes
def get_recipes(token):
    recipes_url = f"{BASE_URL}nutrition/recipe/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(recipes_url, headers=headers)

    if response.status_code == 200:
        print("Recipes:", response.json())
    else:
        print(f"Failed to fetch recipes: {response.text}")


# Function to update user weight
def update_weight(token, weight):
    update_weight_url = f"{BASE_URL}nutrition/update-weight/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"weight": weight}
    response = requests.post(update_weight_url, headers=headers, data=data)

    if response.status_code == 200:
        print("Weight Updated:", response.json())
    else:
        print(f"Failed to update weight: {response.text}")


# Main execution
if __name__ == "__main__":
    # Replace these with your admin credentials
    username = "admin"
    password = "admin"

    # Step 1: Login and get JWT token
    token = get_jwt_token(username, password)

    # If token is valid, proceed to fetch other details
    if token:
        # Step 2: Get Profile Data
        get_profile(token)

        # Step 3: Get Nutrition Recommendations
        get_nutrition_recommendations(token)

        # Step 4: Get Nutrition Plan
        get_nutrition_plan(token)

        # Step 5: Get Recipes
        get_recipes(token)

        # Step 6: Update Weight (Optional, replace with actual weight)
        new_weight = 70  # Example new weight
        update_weight(token, new_weight)
