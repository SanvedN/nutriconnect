# utils/auth.py
import streamlit as st


def is_authenticated():
    return st.session_state.get("authenticated", False)


def get_username():
    return st.session_state.get("username", "")
