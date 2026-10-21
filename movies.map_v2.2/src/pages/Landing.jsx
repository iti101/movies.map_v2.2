import Hero from './Hero.jsx'
import Search from './Search.jsx'
import Randomize from './Randomize.jsx'
import './Landing.css'

function Landing() {
  return (
    <main className="landing">
      <Hero />
      <Search />
      <Randomize />
    </main>
  )
}

export default Landing
