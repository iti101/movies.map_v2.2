import { useEffect, useState } from 'react'
import logoIcon from '../assets/logo_ICON.png'
import moviesLogo from '../assets/moviesLOGO.png'
import { scrollToSection } from '../scrollToSection.js'
import './Typewriter.css'

// wacht functie
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Intro animatie: typt een headline, dan toont de logo en Get Started
function Typewriter() {
  const [text, setText] = useState('')

  // 'typing' = headline, 'brand' = logo + Get Started
  const [phase, setPhase] = useState('typing')

  // of de Get Started knop en de pijl zichtbaar zijn
  const [showCta, setShowCta] = useState(false)

  // runt de intro 1keer wanneer deze component voor het eerst verschijnt
  useEffect(() => {
    // overslaan van de animatie, als de gebruiker dit wilt (brand met Get started verschijnt)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('brand')
      setShowCta(true)
      return
    }
    // wordt true wanneer de component wordt afgehaald, en stopt de animatie
    let cancelled = false

    // lokale kopie van de getypte tekst (voorkomt React Strict Mode dubbel tellen van letters)
    let current = ''
    setText('')
    setPhase('typing')
    setShowCta(false)

    // typt de letters, 1 voor 1
    async function typeText(chunk) {
      for (let i = 0; i < chunk.length; i++) {
        if (cancelled) return
        current += chunk[i]
        setText(current)
        await wait(55)
      }
    }

    // verwijdert de letters v/h einde van de tekst
    async function deleteChars(count) {
      for (let i = 0; i < count; i++) {
        if (cancelled) return
        current = current.slice(0, -1)
        setText(current)
        await wait(30)
      }
    }

    // gehele intro animatie: movie → show → episode → logo → Get Started
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

      // clear the whole line before showing the logo
      await deleteChars(current.length)
      if (cancelled) return
      await wait(300)

      setPhase('brand')
      await wait(1300)
      if (cancelled) return

      setShowCta(true)
    }

    runIntro()

    // stopt de animatie als de gebruiker deze  verlaat
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="intro">
      {/* Typing phase: tekst + cursor */}
      {phase === 'typing' && (
        <h1 className="typing-text">
          {text}
          <span className="cursor">|</span>
        </h1>
      )}

      {/* Brand phase: logo + Get Started + arrow */}
      {phase === 'brand' && (
        <div className="brand-block">
          <div className="brand">
            <img
              className="logo-icon"
              src={logoIcon}
              alt=""
              width={160}
              height={160}
            />
            {/* verschijning v/d de wordmark logo (movies.map + logo*/}
            <div className="logo-clip">
              <img
                className="logo-text"
                src={moviesLogo}
                alt="Movies.map"
                width={320}
                height={32}
              />
            </div>
          </div>

          {showCta && (
            <div className="cta">
              <button
                className="get-started"
                onClick={() => scrollToSection('search')}
              >
                Get Started
              </button>
              <div className="arrow">
                <span className="arrow-bar" />
                <span className="arrow-bar" />
                <span className="arrow-bar" />
                <span className="arrow-bar" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Typewriter
