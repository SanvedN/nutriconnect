# pages/Home.py
def home():
    import streamlit as st

    st.title("Welcome to NutriConnect!")
    st.markdown("Your personal health, nutrition, and fitness assistant.")
    st.image("assets/logo.png", use_column_width=True)
    st.write(
        "Track your progress, plan your meals, and achieve your fitness goals effortlessly!"
    )
