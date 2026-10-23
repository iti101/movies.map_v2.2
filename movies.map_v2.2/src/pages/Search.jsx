import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { searchMovies, posterUrl } from '../api/tmdb'
import { loadSearch, saveSearch } from '../searchMemory'
import searchIcon from '../assets/MagnifyingGlass.svg'
import './Search.css'

// Search section: title, search bar, and a poster grid of results
function Search() {
  // start from the last search, so Back from a movie can show the same results
  const saved = loadSearch()

  // text in the search input
  const [query, setQuery] = useState(saved.query)

  // lijst van films/resultaten van de API
  const [results, setResults] = useState(saved.results)

  // true wanneer wachten op de API
  const [loading, setLoading] = useState(false)

  // error bericht, of null wanneer alles goed is
  const [error, setError] = useState(null)

  // true after the user has submitted at least one search
  const [searched, setSearched] = useState(saved.searched)

  // runs when the user submits the form (Enter or the search button)
  async function handleSubmit(event) {
    // stop the page from reloading
    event.preventDefault()

    // ignore empty searches
    const text = query.trim()
    if (!text) return

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      // vraagt de API voor films die overeenkomen met de tekst
      const movies = await searchMovies(text)
      setResults(movies)
      saveSearch(text, movies, true)
    } catch (err) {
      // verwijdert de oude resultaten en toont het error bericht
      setResults([])
      saveSearch(text, [], true)
      setError(err.message)
    } finally {
      // stopt de loading animatie
      setLoading(false)
    }
  }

  // 'true' wanneer er films te tonen zijn onder de zoekbalk
  const hasResults = !error && !loading && results.length > 0

  return (
    // "open" verschuift de zoekbalk om de resultaten te tonen
    <section id="search" className={hasResults ? 'search open' : 'search'}>
      <div className="search-box">
        <h2 className="search-title">Search</h2>

        {/* zoekbalk met de ronde zoek-knop erin */}
        <form className="search-field" onSubmit={handleSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="Search movies..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={loading}
          />
          <Button shape="round" size="small" type="submit" disabled={loading}>
            <img src={searchIcon} alt="Search" className="search-icon" />
          </Button>
        </form>

        {/* status berichten onder de zoekbalk */}
        {error && <p className="search-message">{error}</p>}
        {!error && loading && <p className="search-message">Searching...</p>}
        {!error && !loading && searched && results.length === 0 && (
          <p className="search-message">No movies found.</p>
        )}

        {/* poster grid + 'alle films' (alleen wanneer er resultaten zijn) */}
        {hasResults && (
          <div className="results-area">
            {/* Dead link for now — later this goes to movieResultsPage */}
            <div className="see-all-row">
              <a
                href="#"
                className="see-all"
                onClick={(event) => event.preventDefault()}
              >
                See all
              </a>
            </div>

            <div className="results">
              {results.map((movie) => {
                // neemt alleen het jaar van de release date (YYYY-MM-DD)
                const year = movie.release_date
                  ? movie.release_date.slice(0, 4)
                  : ''
                const poster = posterUrl(movie.poster_path)

                return (
                  <Link
                    key={movie.id}
                    to={'/movie/' + movie.id}
                    className="movie"
                  >
                    {poster ? (
                      <img src={poster} alt="" className="movie-poster" />
                    ) : (
                      <div className="movie-poster empty" />
                    )}
                    <p className="movie-title">{movie.title}</p>
                    {year && <p className="movie-year">{year}</p>}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Search
