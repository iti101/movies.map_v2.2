import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './NavBar.css'
import loginIcon from '../assets/login_opsz24.svg'
import logoutIcon from '../assets/logout_opsz24.svg'
import darkModeIcon from '../assets/dark_mode_opsz24.svg'
import lightModeIcon from '../assets/light_mode_opsz24.svg'


function NavBar() {
  // state van menu (open/gesloten)
  const [isOpen, setIsOpen] = useState(false)

  // state van login/logout icon
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // state van dark/light-mode
  const [isDark, setIsDark] = useState(false)

  const location = useLocation()
  // 'true' wanneer we op de landingspagina zijn (hash links werken daar)
  const onHome = location.pathname === '/'

  // opent of sluit het menu
  function toggleMenu() {
    setIsOpen(!isOpen)
    document.body.style.overflow = isOpen ? 'auto' : 'hidden'
  }

  // sluit het menu nadat er op een link is geklikt
  function closeMenu() {
    setIsOpen(false)
    document.body.style.overflow = 'auto'
  }

  // verwisselt de login en logout icon (modal wordt later toegevoegd)
  function toggleAuthIcon() {
    setIsLoggedIn(!isLoggedIn)
  }

  // schakelt tussen light en dark mode door de "dark" class toe te voegen/verwijderen op de body
  function toggleTheme() {
    setIsDark(!isDark)
    document.body.classList.toggle('dark')
  }

  return (
    <header className={isOpen ? 'navbar open' : 'navbar'}>
      {/* Top row: hamburger on the left, mode and auth icons on the right */}
      <div className="navbar-top">
        {/* Hamburger icon: three lines that turn into an X when the menu is open */}
        <button className="hamburger" onClick={toggleMenu}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </button>

        {/* groepering v/d twee icon buttons rechts */}
        <div className="navbar-icons">
          {/* Light / dark mode button: shows the moon in light mode and the sun in dark mode */}
          <button className="icon-button" onClick={toggleTheme}>
            <img
              src={isDark ? lightModeIcon : darkModeIcon}
              alt=""
              className="icon"
            />
          </button>

          {/* Login/logout icon button (top right) */}
          <button className="icon-button" onClick={toggleAuthIcon}>
            <img
              src={isLoggedIn ? logoutIcon : loginIcon}
              alt=""
              className="icon"
            />
          </button>
        </div>
      </div>

      {/* scheidslijn van de NavBar */}
      <div className="divider"></div>

      {/* fullscreen menu met links naar elke sectie*/}
      <nav className="menu">
        <ul className="menu-links">
          <li>
            {onHome ? (
              <a href="#home" onClick={closeMenu}>
                Home
              </a>
            ) : (
              <Link to="/#home" onClick={closeMenu}>
                Home
              </Link>
            )}
          </li>
          <li>
            {onHome ? (
              <a href="#search" onClick={closeMenu}>
                Search
              </a>
            ) : (
              <Link to="/#search" onClick={closeMenu}>
                Search
              </Link>
            )}
          </li>
          <li>
            {onHome ? (
              <a href="#randomize" onClick={closeMenu}>
                Randomize
              </a>
            ) : (
              <Link to="/#randomize" onClick={closeMenu}>
                Randomize
              </Link>
            )}
          </li>
          {/* Not linked yet: will open the profile page or the login modal later */}
          <li>
            <span className="dead-link">My Watchlist</span>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default NavBar
