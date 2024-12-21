# pages/GenerateProgressReport.py
def generate_progress_report():
    import streamlit as st
    from utils.api import get_weekly_plan

    st.title("Generate Progress Report")

    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    response = get_weekly_plan(token)
    if response:
        st.json(response)
    else:
        st.error("Failed to generate progress report.")
