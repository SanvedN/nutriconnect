import React, { createContext, useState, useContext } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }))
  }

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}