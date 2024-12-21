# utils/api.py
import requests

BASE_URL = "http://127.0.0.1:8000/api"


def login(username, password):
    """Log in the user and return the JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/login/", data={"username": username, "password": password}
        )
        if response.status_code == 200:
            response_json = response.json()
            token = response_json.get("access")
            if token:
                return {"status": "success", "token": token}
        return {
            "status": "failure",
            "message": response.json().get("detail", "Unknown error"),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def signup(username, email, password):
    try:
        response = requests.post(
            f"{BASE_URL}/register/",
            data={"username": username, "email": email, "password": password},
        )
        return response.status_code == 201
    except Exception as e:
        print(f"Signup failed: {e}")
    return False


def get_profile(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Failed to fetch profile: {e}")
    return None


def update_profile(token, profile_data):
    """Update user profile"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(
            f"{BASE_URL}/profile/", headers=headers, json=profile_data
        )
        if response.status_code == 200:
            return response.json()
        else:
            print("Error:", response.json())
            return None
    except Exception as e:
        print(f"Failed to update profile: {e}")
        return None


def update_weight(token, weight):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {"weight": weight}
        response = requests.post(
            f"{BASE_URL}/nutrition/update-weight/", headers=headers, data=data
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to update weight: {e}")
    return False


def get_weekly_plan(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/weekly-plan/", headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Failed to fetch weekly plan: {e}")
    return None


def get_recipes(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/nutrition/recipe/", headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Failed to fetch recipes: {e}")
    return None
