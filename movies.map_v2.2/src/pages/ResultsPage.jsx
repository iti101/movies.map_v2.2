import { useEffect, useState } from 'react'
import Button from '../components/Button'
import ResultCard from '../components/ResultCard'
import { fetchForFilter, SEARCH_PLACEHOLDERS } from '../runSearchQuery'
import { loadSearch, saveSearch } from '../searchMemory'
import searchIcon from '../assets/MagnifyingGlass.svg'
import './ResultsPage.css'

// full-page results grid with a centered search bar on top
function ResultsPage() {
  const saved = loadSearch()

  const [query, setQuery] = useState(saved.query)
  const [results, setResults] = useState(saved.results)
  const [filter] = useState(saved.filter || 'movies')
  const [genreId] = useState(saved.genreId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // zet scroll-snap uit zodat deze pagina normaal kan scrollen
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
    return () => {
      document.documentElement.classList.remove('no-snap')
    }
  }, [])

  // voert een zoekopdracht uit met de opgeslagen filter / genre
  async function runSearch(text) {
    const trimmed = text.trim()

    if (filter === 'genre') {
      if (!trimmed && !genreId) return
    } else if (!trimmed) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = await fetchForFilter(filter, text, genreId)
      setResults(items)
      saveSearch(text, items, true, filter, genreId)
    } catch (err) {
      setResults([])
      saveSearch(text, [], true, filter, genreId)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // form submit: zoek opnieuw met de huidige filter
  async function handleSubmit(event) {
    event.preventDefault()
    await runSearch(query)
  }

  return (
    <main className="results-page">
      <form className="results-page-search" onSubmit={handleSubmit}>
        <input
          type="text"
          className="results-page-input"
          placeholder={SEARCH_PLACEHOLDERS[filter]}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          inputMode={filter === 'year' ? 'numeric' : 'text'}
          disabled={loading}
        />
        <Button shape="round" size="small" type="submit" disabled={loading}>
          <img src={searchIcon} alt="Search" className="results-page-icon" />
        </Button>
      </form>

      {error && <p className="results-page-message">{error}</p>}
      {!error && loading && (
        <p className="results-page-message">Searching...</p>
      )}
      {!error && !loading && results.length === 0 && (
        <p className="results-page-message">No results found.</p>
      )}

      {!error && !loading && results.length > 0 && (
        <div className="results-page-grid">
          {results.map((item) => {
            const key = (item.media_type || 'movie') + '-' + item.id
            return <ResultCard key={key} item={item} />
          })}
        </div>
      )}
    </main>
  )
}

export default ResultsPage
