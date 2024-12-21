# pages/RecipeGenerator.py
def recipe_generator():
    import streamlit as st
    from utils.api import get_recipes

    st.title("Recipe Generator")

    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    if st.button("Generate Recipe"):
        response = get_recipes(token)
        if response:
            st.text_area("Generated Recipe", response, height=300)
        else:
            st.error("Failed to generate recipe.")
