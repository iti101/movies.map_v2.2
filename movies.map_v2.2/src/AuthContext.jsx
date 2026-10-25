import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from './components/LoginModal.jsx'
import SignupModal from './components/SignupModal.jsx'
import {
  clearSession,
  getToken,
  getUser,
  isLoggedIn as hasSession,
  saveSession,
} from './authSession.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasSession())
  const [user, setUser] = useState(() => getUser())
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)

  const openLogin = useCallback(() => {
    setIsSignupOpen(false)
    setIsLoginOpen(true)
  }, [])

  const openSignup = useCallback(() => {
    setIsLoginOpen(false)
    setIsSignupOpen(true)
  }, [])

  const closeAuthModals = useCallback(() => {
    setIsLoginOpen(false)
    setIsSignupOpen(false)
  }, [])

  const login = useCallback((session) => {
    saveSession({ token: session.token, user: session.user })
    setUser(getUser())
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setIsLoggedIn(false)
  }, [])

  // verlopen sessie als uitgelogd behandelen
  useEffect(() => {
    if (!hasSession()) {
      clearSession()
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      token: getToken(),
      openLogin,
      openSignup,
      closeAuthModals,
      login,
      logout,
    }),
    [isLoggedIn, user, openLogin, openSignup, closeAuthModals, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoggedIn={(data) => {
          login(data)
        }}
        onCreateAccount={openSignup}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignedUp={(data) => {
          login(data)
        }}
        onSignIn={openLogin}
        onBackHome={() => {
          setIsSignupOpen(false)
          navigate('/#home')
        }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
