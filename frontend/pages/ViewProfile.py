# pages/ViewProfile.py
def view_profile():
    import streamlit as st
    from utils.api import get_profile

    st.title("View Profile")
    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    response = get_profile(token)
    if response:
        st.json(response)
    else:
        st.error("Failed to load profile.")
