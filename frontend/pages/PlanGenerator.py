def plan_generator():
    import streamlit as st
    from utils.api import get_weekly_plan

    st.title("Weekly Nutrition and Workout Plan")

    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    if st.button("Generate Weekly Plan"):
        response = get_weekly_plan(token)
        if response:
            st.subheader("Nutrition Plan")
            nutrition_plan = response.get("nutrition_plan", {})
            if nutrition_plan:
                for day, meals in nutrition_plan.items():
                    st.markdown(f"### {day.capitalize()}")
                    for meal_type, details in meals.items():
                        st.markdown(
                            f"- **{meal_type.capitalize()}**: {details['meal']} "
                            f"({details['calories']} kcal, Protein: {details['protein']}g, "
                            f"Carbs: {details['carbs']}g, Fat: {details['fat']}g)"
                        )
            else:
                st.error("No nutrition plan available.")

            st.subheader("Workout Plan")
            workout_plan = response.get("workout_plan", {})
            if workout_plan:
                for day, details in workout_plan.items():
                    st.markdown(f"### {day.capitalize()}")
                    for exercise in details.get("exercises", []):
                        st.markdown(
                            f"- **{exercise['name']}**: {exercise['sets']} sets of {exercise['reps']} reps, Rest: {exercise['rest']}"
                        )
            else:
                st.error("No workout plan available.")
        else:
            st.error("Failed to generate weekly plans.")
