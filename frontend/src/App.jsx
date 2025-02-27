import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import  Navbar from './components/Navbar'
import Auth from './pages/Auth'
import Home from './pages/Home'
import MealPlanning from './pages/MealPlanning';

import { UserProvider } from './context/UserContexts'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-lime-200">
          <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          <Routes>
            <Route path="/auth" element={
              isLoggedIn ? <Navigate to="/home" /> : <Auth onLogin={handleLogin} />
            } />
            <Route path="/home" element={
              isLoggedIn ? <Home /> : <Navigate to="/auth" />
            } />
            <Route path="/meal-planning" element={<MealPlanning />} />


            <Route path="/" element={<Navigate to={isLoggedIn ? "/home" : "/auth"} />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  )
}