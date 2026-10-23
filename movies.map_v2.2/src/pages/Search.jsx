import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { searchMulti, posterUrl, profileUrl, getSuggestionTitles } from '../api/tmdb'
import { findSuggestion } from '../suggestQuery'
import { loadSearch, saveSearch } from '../searchMemory'
import searchIcon from '../assets/MagnifyingGlass.svg'
import './Search.css'

// normaliseert een multi-search resultaat voor de poster-grid
function getResultDisplay(item) {
  // oude session-cache had alleen films zonder media_type
  const type = item.media_type || 'movie'

  if (type === 'movie') {
    return {
      title: item.title,
      info: item.release_date ? item.release_date.slice(0, 4) : '',
      image: posterUrl(item.poster_path),
      to: '/movie/' + item.id,
    }
  }

  if (type === 'tv') {
    return {
      title: item.name,
      info: item.first_air_date ? item.first_air_date.slice(0, 4) : '',
      image: posterUrl(item.poster_path),
      to: '/tv/' + item.id,
    }
  }

  // person (actor / actress / director, enzovoort) — geen detailpagina nog
  return {
    title: item.name,
    info: item.known_for_department || 'Person',
    image: profileUrl(item.profile_path),
    to: null,
  }
}

// Search section: title, search bar, and a poster grid of results
function Search() {
  // start vanaf de laatste zoekopdracht, zodat Back van een film dezelfde resultaten toont
  const saved = loadSearch()

  // text in the search input
  const [query, setQuery] = useState(saved.query)

  // lijst van resultaten van de API (films, series, personen)
  const [results, setResults] = useState(saved.results)

  // true wanneer wachten op de API
  const [loading, setLoading] = useState(false)

  // error bericht, of null wanneer alles goed is
  const [error, setError] = useState(null)

  // true after the user has submitted at least one search
  const [searched, setSearched] = useState(saved.searched)

  // "Did you mean" near-miss title, or null when hidden
  const [suggestion, setSuggestion] = useState(null)

  // broad title list for fuzzy matching (session cache via tmdb.js)
  const [titles, setTitles] = useState([])

  // load title corpus once for typo suggestions
  useEffect(() => {
    let cancelled = false

    getSuggestionTitles()
      .then((list) => {
        if (!cancelled) setTitles(list)
      })
      .catch(() => {
        // suggestions are optional — ignore corpus load failures
      })

    return () => {
      cancelled = true
    }
  }, [])

  // while typing / after search: debounced "Did you mean" (local list + spelling fallback)
  useEffect(() => {
    if (loading || error) {
      setSuggestion(null)
      return
    }

    const text = query.trim()
    if (text.length < 3) {
      setSuggestion(null)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      findSuggestion(text, titles).then((match) => {
        if (!cancelled) setSuggestion(match)
      })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, loading, error, titles])

  // shared search runner (form submit + "Did you mean" click)
  async function runSearch(text) {
    const trimmed = text.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setSearched(true)
    setSuggestion(null)

    try {
      const items = await searchMulti(trimmed)
      setResults(items)
      saveSearch(trimmed, items, true)
      // suggestion is resolved by the debounce effect once loading is false
    } catch (err) {
      setResults([])
      saveSearch(trimmed, [], true)
      setError(err.message)
      setSuggestion(null)
    } finally {
      setLoading(false)
    }
  }

  // runs when the user submits the form (Enter or the search button)
  async function handleSubmit(event) {
    event.preventDefault()
    await runSearch(query)
  }

  // applies the "Did you mean" title and searches again
  async function applySuggestion() {
    if (!suggestion) return
    setQuery(suggestion)
    await runSearch(suggestion)
  }

  // 'true' wanneer er resultaten te tonen zijn onder de zoekbalk
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
            placeholder="Search movies, shows, people..."
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
          <p className="search-message">No results found.</p>
        )}
        {!error && !loading && suggestion && (
          <p className="search-did-you-mean">
            Did you mean:{' '}
            <button
              type="button"
              className="search-suggestion"
              onClick={applySuggestion}
            >
              {suggestion}
            </button>
            ?
          </p>
        )}

        {/* poster grid + 'alle resultaten' (alleen wanneer er resultaten zijn) */}
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
              {results.map((item) => {
                const display = getResultDisplay(item)
                const key = (item.media_type || 'movie') + '-' + item.id

                const content = (
                  <>
                    {display.image ? (
                      <img src={display.image} alt="" className="movie-poster" />
                    ) : (
                      <div className="movie-poster empty" />
                    )}
                    <p className="movie-title">{display.title}</p>
                    {display.info && (
                      <p className="movie-year">{display.info}</p>
                    )}
                  </>
                )

                // films en series gaan naar hun detailpagina
                if (display.to) {
                  return (
                    <Link key={key} to={display.to} className="movie">
                      {content}
                    </Link>
                  )
                }

                // personen: dead link tot ActorDetailPage klaar is
                return (
                  <a
                    key={key}
                    href="#"
                    className="movie"
                    onClick={(event) => event.preventDefault()}
                  >
                    {content}
                  </a>
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
