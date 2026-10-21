import { useState } from 'react'
import './NavBar.css'
import loginIcon from '../assets/login_opsz24.svg'
import logoutIcon from '../assets/logout_opsz24.svg'
import darkModeIcon from '../assets/dark_mode_opsz24.svg'
import lightModeIcon from '../assets/light_mode_opsz24.svg'

// Top navigation bar: hamburger button, dividing line, and full-screen menu
function NavBar() {
  // Remembers whether the menu is open (true) or closed (false)
  const [isOpen, setIsOpen] = useState(false)

  // Remembers which auth icon to show (false = login, true = logout)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Remembers which color mode is active (false = light, true = dark)
  const [isDark, setIsDark] = useState(false)

  // Opens or closes the menu, and stops the page from scrolling while it is open
  function toggleMenu() {
    setIsOpen(!isOpen)
    document.body.style.overflow = isOpen ? 'auto' : 'hidden'
  }

  // Closes the menu after a link is clicked and lets the page scroll again
  function closeMenu() {
    setIsOpen(false)
    document.body.style.overflow = 'auto'
  }

  // Swaps the login and logout icons (modal will be added later)
  function toggleAuthIcon() {
    setIsLoggedIn(!isLoggedIn)
  }

  // Switches between light and dark mode by adding/removing the "dark" class on the body
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

        {/* Groups the two icon buttons together on the right */}
        <div className="navbar-icons">
          {/* Light / dark mode button: shows the moon in light mode and the sun in dark mode */}
          <button className="icon-button" onClick={toggleTheme}>
            <img
              src={isDark ? lightModeIcon : darkModeIcon}
              alt=""
              className="icon"
            />
          </button>

          {/* Login / logout icon button (top right) */}
          <button className="icon-button" onClick={toggleAuthIcon}>
            <img
              src={isLoggedIn ? logoutIcon : loginIcon}
              alt=""
              className="icon"
            />
          </button>
        </div>
      </div>

      {/* Thin line across the top of the page */}
      <div className="divider"></div>

      {/* Full-screen menu with links to each section of the landing page */}
      <nav className="menu">
        <ul className="menu-links">
          <li>
            <a href="#home" onClick={closeMenu}>
              Home
            </a>
          </li>
          <li>
            <a href="#search" onClick={closeMenu}>
              Search
            </a>
          </li>
          <li>
            <a href="#randomize" onClick={closeMenu}>
              Randomize
            </a>
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
