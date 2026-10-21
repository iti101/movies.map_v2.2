import { useEffect, useState } from 'react'
import logoIcon from '../assets/logo_ICON.png'
import moviesLogo from '../assets/moviesLOGO.png'
import { scrollToSection } from '../scrollToSection.js'
import './Typewriter.css'

// How many horizontal bars make up the scroll arrow under Get Started
const ARROW_BARS = 4

// Waits a given number of milliseconds before continuing
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function Typewriter() {
  // The letters currently shown during the typing phase
  const [text, setText] = useState('')

  // Which screen to show: 'typing' (text) or 'brand' (logo)
  const [phase, setPhase] = useState('typing')

  // Whether the Get Started button and arrow are visible yet
  const [showCta, setShowCta] = useState(false)

  // Runs the intro animation once when this component first appears
  useEffect(() => {
    // Skip the typing show if the user prefers less motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('brand')
      setShowCta(true)
      return
    }

    // Becomes true when the component unmounts, so we stop the animation
    let cancelled = false

    // Local copy of the typed text (avoids React Strict Mode doubling letters)
    let current = ''
    setText('')
    setPhase('typing')
    setShowCta(false)

    // Types one string of letters onto the screen, letter by letter
    async function typeText(chunk) {
      for (let i = 0; i < chunk.length; i++) {
        if (cancelled) return
        current += chunk[i]
        setText(current)
        await wait(55)
      }
    }

    // verwijdert letters van het einde van de tekst
    async function deleteChars(count) {
      for (let i = 0; i < count; i++) {
        if (cancelled) return
        current = current.slice(0, -1)
        setText(current)
        await wait(30)
      }
    }

    // de volledige typing animatie: movie → show → episode → logo → Get Started
    async function runIntro() {
      await typeText('Find any')
      if (cancelled) return
      await wait(200)

      await typeText(' movie')
      if (cancelled) return
      await wait(450)

      await deleteChars(5)
      if (cancelled) return
      await wait(100)

      await typeText('show')
      if (cancelled) return
      await wait(500)

      await deleteChars(4)
      if (cancelled) return
      await wait(100)

      await typeText('episode')
      if (cancelled) return
      await wait(500)

      // verwijdert de hele lijn voordat het logo wordt getoond
      await deleteChars(current.length)
      if (cancelled) return
      await wait(300)

      setPhase('brand')
      await wait(1300)
      if (cancelled) return

      setShowCta(true)
    }

    runIntro()

    // stopt de animatie als de gebruiker de pagina verlaat tijdens de intro
    return () => {
      cancelled = true
    }
  }, [])

  // Scrolls smoothly down to the Search section
  function goToSearch() {
    scrollToSection('search')
  }

  return (
    <div className="intro">
      {/* Typing phase: growing / shrinking headline with a blinking cursor */}
      {phase === 'typing' && (
        <h1 className="typewriter">
          {text}
          <span className="typewriter__cursor">|</span>
        </h1>
      )}

      {/* Brand phase: logo icon + wordmark, then Get Started */}
      {phase === 'brand' && (
        <div className="intro__lockup">
          {/* Logo icon and wordmark side by side */}
          <div className="intro__brand">
            <img
              className="intro__icon"
              src={logoIcon}
              alt=""
              width={160}
              height={160}
            />
            <div className="intro__wordmark-clip">
              <div className="intro__wordmark-inner">
                <img
                  className="intro__wordmark"
                  src={moviesLogo}
                  alt="Movies.map"
                  width={320}
                  height={32}
                />
              </div>
            </div>
          </div>

          {/* Get Started button and the arrow pointing down to Search */}
          {showCta && (
            <div className="intro__cta">
              <button className="intro__start" onClick={goToSearch}>
                Get Started
              </button>
              <div className="intro__arrow">
                {Array.from({ length: ARROW_BARS }, (_, i) => (
                  <span key={i} className="intro__arrow-bar" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Typewriter
