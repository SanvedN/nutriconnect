import streamlit as st
from utils.api import login, signup, get_profile

# Configure the app layout
st.set_page_config(
    page_title="NutriConnect",
    page_icon="🍎",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Session state for user authentication
if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False
    st.session_state["username"] = ""


def set_theme():
    """Toggle theme mode."""
    if st.session_state.get("dark_mode", False):
        st.markdown(
            '<link href="assets/dark_mode.css" rel="stylesheet">',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<link href="assets/light_mode.css" rel="stylesheet">',
            unsafe_allow_html=True,
        )


set_theme()

# Sidebar for navigation
st.sidebar.title("NutriConnect")
st.sidebar.markdown("Your personal health and fitness assistant.")

if st.session_state["authenticated"]:
    st.sidebar.success(f"Logged in as {st.session_state['username']}.")
    page = st.sidebar.radio(
        "Navigate",
        [
            "Home",
            "View Profile",
            "Update Profile",
            "Update Weight",
            "Generate Progress Report",
            "Recipe Generator",
            "Plan Generator",
        ],
    )

    # Light/Dark mode toggle
    if st.sidebar.checkbox("Dark Mode", value=False):
        st.session_state["dark_mode"] = True
    else:
        st.session_state["dark_mode"] = False

    set_theme()

    # Navigation
    if page == "Home":
        st.title("Welcome to NutriConnect!")
        st.write("Track your health, manage your diet, and stay fit.")
    elif page == "View Profile":
        from pages.ViewProfile import view_profile

        view_profile()
    elif page == "Update Profile":
        from pages.UpdateProfile import update_profile

        update_profile()
    elif page == "Update Weight":
        from pages.UpdateWeight import update_weight

        update_weight()
    elif page == "Generate Progress Report":
        from pages.GenerateProgressReport import generate_progress_report

        generate_progress_report()
    elif page == "Recipe Generator":
        from pages.RecipeGenerator import recipe_generator

        recipe_generator()
    elif page == "Plan Generator":
        from pages.PlanGenerator import plan_generator

        plan_generator()

    # Logout option
    if st.sidebar.button("Logout"):
        st.session_state["authenticated"] = False
        st.experimental_rerun()
else:
    # Login/Signup Form
    st.title("Login or Signup")
    tab1, tab2 = st.tabs(["Login", "Signup"])

    with tab1:
        st.subheader("Login")
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")

        if st.button("Login"):
            response = login(username, password)
            if response.get("status") == "success":
                st.session_state["authenticated"] = True
                st.session_state["token"] = response.get("token")
                st.session_state["username"] = username
                st.success("Login successful!")
                # Refresh the app to show logged-in state
            else:
                st.error(f"Login failed: {response.get('message')}")

    with tab2:
        st.subheader("Signup")
        new_username = st.text_input("New Username", key="signup_username")
        new_email = st.text_input("Email", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")

        if st.button("Signup"):
            response = signup(new_username, new_email, new_password)
            if response.get("status") == "success":
                st.success("Account created successfully! Please login.")
            else:
                st.error(response.get("message", "Signup failed"))
