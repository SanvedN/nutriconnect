# pages/UpdateWeight.py
def update_weight():
    import streamlit as st
    from utils.api import update_weight

    st.title("Update Weight")

    token = st.session_state.get("token")
    if not token:
        st.error("You need to login first.")
        return

    weight = st.number_input("New Weight (kg)", min_value=0.0, step=0.1)
    if st.button("Update Weight"):
        if update_weight(token, weight):
            st.success("Weight updated successfully!")
        else:
            st.error("Failed to update weight.")
