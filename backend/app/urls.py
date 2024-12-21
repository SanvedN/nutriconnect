from django.urls import path
from .views import (
    LoginView,
    ProtectedView,
    RegisterUserView,
    ProfileView,
    NutritionRecommendationView,
    NutritionPlanView,
    RecipeView,
    UpdateWeightView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterUserView.as_view(), name="register"),  # Register endpoint
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "nutrition/",
        NutritionRecommendationView.as_view(),
        name="nutrition_recommendation",
    ),
    path("nutrition/plan/", NutritionPlanView.as_view(), name="nutrition_plan"),
    path("nutrition/recipe/", RecipeView.as_view(), name="recipe"),
    path("nutrition/update-weight/", UpdateWeightView.as_view(), name="update_weight"),
    path(
        "protected/", ProtectedView.as_view(), name="protected"
    ),  # Protected page for testing auth
]
