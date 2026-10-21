import Button from '../components/Button'
import searchIcon from '../assets/MagnifyingGlass.svg'
import './Search.css'

// Search sectie: titel boven een tekstveld met een ronde zoek-knop erin
function Search() {
  return (
    <section id="search" className="search">
      <div className="search-box">
        <h2 className="search-title">Search</h2>

        {/* Input veld met placeholder tekst */}
        <div className="search-field">
          <input
            type="text"
            className="search-input"
            placeholder="Search movies..."
          />
          {/* ronde zoek-knop */}
          <Button shape="round" size="small" type="button">
            <img src={searchIcon} alt="Search-button" className="search-icon" />
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Search
