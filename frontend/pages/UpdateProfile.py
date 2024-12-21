def update_profile():
    import streamlit as st
    from utils.api import update_profile

    st.title("Update Profile")

    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    with st.form("update_profile_form"):
        gender = st.selectbox("Gender", ["M", "F", "O"])
        age = st.number_input("Age", min_value=0, step=1)
        height = st.number_input("Height (cm)", min_value=0.0, step=0.1)
        weight = st.number_input("Weight (kg)", min_value=0.0, step=0.1)
        target_weight = st.number_input("Target Weight (kg)", min_value=0.0, step=0.1)
        timeline = st.text_input("Timeline")
        activity_level = st.selectbox(
            "Activity Level",
            ["sedentary", "light", "moderate", "active", "very_active"],
        )
        meal_preference = st.text_input("Meal Preference")

        submitted = st.form_submit_button("Update")
        if submitted:
            profile_data = {
                "gender": gender,
                "age": age,
                "height": height,
                "weight": weight,
                "target_weight": target_weight,
                "timeline": timeline,
                "activity_level": activity_level,
                "meal_preference": meal_preference,
            }
            response = update_profile(token, profile_data)
            if response:
                st.success("Profile updated successfully!")
            else:
                st.error("Failed to update profile. Please check your inputs.")
