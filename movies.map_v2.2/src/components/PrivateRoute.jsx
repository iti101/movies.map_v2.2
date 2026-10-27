import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

// blokkeert een pagina voor uitgelogde bezoekers en stuurt ze naar inloggen
function PrivateRoute({ children }) {
  const { isLoggedIn, openLogin } = useAuth()
  const location = useLocation()
  // true als deze pagina al open was terwijl de gebruiker nog ingelogd was
  const wasLoggedIn = useRef(isLoggedIn)

  useEffect(() => {
    // een directe bezoek opent de login-modal; uitloggen doet dat niet
    if (!isLoggedIn && !wasLoggedIn.current) {
      openLogin()
    }
    wasLoggedIn.current = isLoggedIn
  }, [isLoggedIn, openLogin])

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/"
        replace
        state={wasLoggedIn.current ? undefined : { from: location }}
      />
    )
  }

  return children
}

export default PrivateRoute
