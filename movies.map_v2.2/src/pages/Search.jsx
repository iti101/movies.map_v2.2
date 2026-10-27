import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import ResultCard from '../components/ResultCard'
import {
  getMovieGenres,
  getSuggestionTitles,
} from '../api/tmdb'
import { fetchForFilter, SEARCH_PLACEHOLDERS } from '../runSearchQuery'
import { findSuggestion } from '../suggestQuery'
import { loadSearch, saveSearch } from '../searchMemory'
import searchIcon from '../assets/MagnifyingGlass.svg'
import './Search.css'

const FILTERS = [
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TVShows' },
  { id: 'people', label: 'People' },
  { id: 'year', label: 'Release year' },
  { id: 'genre', label: 'Genre' },
]

// Search section: title, search bar, filter pills, and a poster grid of results
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

  // actieve filter-pill (één tegelijk)
  const [filter, setFilter] = useState(saved.filter || 'movies')

  // geselecteerd genre id (alleen relevant in genre-modus)
  const [selectedGenreId, setSelectedGenreId] = useState(saved.genreId)

  // TMDB genre lijst voor de #hashtag knoppen
  const [genres, setGenres] = useState([])

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

  // laad genres wanneer Genre-filter actief wordt
  useEffect(() => {
    if (filter !== 'genre') return

    let cancelled = false

    getMovieGenres()
      .then((list) => {
        if (!cancelled) setGenres(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [filter])

  // while typing / after search: debounced "Did you mean" (alleen voor titel-zoeken)
  useEffect(() => {
    if (filter !== 'movies' && filter !== 'tv' && filter !== 'genre') {
      setSuggestion(null)
      return
    }

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
  }, [query, loading, error, titles, filter])

  // shared search runner (form submit + "Did you mean" + genre click)
  async function runSearch(text, activeFilter = filter, genreId = selectedGenreId) {
    const trimmed = text.trim()

    if (activeFilter === 'genre') {
      // genre-modus heeft óf een titel óf een gekozen genre nodig
      if (!trimmed && !genreId) return
    } else if (!trimmed) {
      return
    }

    setLoading(true)
    setError(null)
    setSearched(true)
    setSuggestion(null)

    try {
      const items = await fetchForFilter(activeFilter, text, genreId)
      setResults(items)
      saveSearch(text, items, true, activeFilter, genreId)
    } catch (err) {
      setResults([])
      saveSearch(text, [], true, activeFilter, genreId)
      setError(err.message)
      setSuggestion(null)
    } finally {
      setLoading(false)
    }
  }

  // wisselt naar een andere filter-pill; wist resultaten voor een schone start
  function handleFilterChange(nextFilter) {
    if (nextFilter === filter) return

    setFilter(nextFilter)
    setQuery('')
    setResults([])
    setError(null)
    setSearched(false)
    setSuggestion(null)
    setSelectedGenreId(null)
    saveSearch('', [], false, nextFilter, null)
  }

  // runs when the user submits the form (Enter or the search button)
  async function handleSubmit(event) {
    event.preventDefault()
    await runSearch(query)
  }

  // past een genre-hashtag toe; behoudt de huidige titel als die er is
  async function handleGenreClick(genre) {
    setSelectedGenreId(genre.id)
    await runSearch(query, 'genre', genre.id)
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
            placeholder={SEARCH_PLACEHOLDERS[filter]}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputMode={filter === 'year' ? 'numeric' : 'text'}
            disabled={loading}
          />
          <Button shape="round" size="small" type="submit" disabled={loading}>
            <img src={searchIcon} alt="Search" className="search-icon" />
          </Button>
        </form>

        {/* filter pills: één actieve modus tegelijk */}
        <div className="search-filters" role="group" aria-label="Search filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                filter === item.id
                  ? 'search-filter-pill active'
                  : 'search-filter-pill'
              }
              onClick={() => handleFilterChange(item.id)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* genre hashtags — alleen zichtbaar wanneer Genre actief is */}
        {filter === 'genre' && genres.length > 0 && (
          <div className="search-genres" role="group" aria-label="Genres">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={
                  selectedGenreId === genre.id
                    ? 'search-genre-link active'
                    : 'search-genre-link'
                }
                onClick={() => handleGenreClick(genre)}
                disabled={loading}
              >
                #{genre.name.replace(/\s+/g, '')}
              </button>
            ))}
          </div>
        )}

        {/* status berichten onder de search-bar */}
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
            <div className="see-all-row">
              <Link to="/results" className="see-all">
                See all
              </Link>
            </div>

            <div className="results">
              {results.map((item) => {
                const key = (item.media_type || 'movie') + '-' + item.id
                return <ResultCard key={key} item={item} />
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Search
