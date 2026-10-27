import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { loadSearch } from '../searchMemory'
import Hero from './Hero.jsx'
import Search from './Search.jsx'
import Randomize from './Randomize.jsx'
import './Landing.css'

function Landing() {
  const location = useLocation()

  // scroll 
  useEffect(() => {
    let id = location.hash ? location.hash.slice(1) : ''

    if (!id && loadSearch().searched) {
      id = 'search'
    }

    if (!id) return

    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView()
    }
  }, [location])

  return (
    <main className="landing">
      <Hero />
      <Search />
      <Randomize />
    </main>
  )
}

export default Landing
