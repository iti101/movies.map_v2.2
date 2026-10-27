import { useEffect, useState } from 'react'
import { getMovieGenres, getTvGenres, searchPeople } from '../api/tmdb'
import { fetchRandomPool, pickSuggestion } from '../randomizeQuery.js'
import Button from '../components/Button.jsx'
import ResultCard from '../components/ResultCard.jsx'
import './Randomize.css'

// namen voor de 5 stappen van de wizard
const STEPS = {
  media: 1,
  likeGenre: 2,
  dislikeGenre: 3,
  person: 4,
  result: 5,
}

// wizard: vier vragen, daarna één filmsuggestie
function Randomize() {
  // huidige stap en antwoorden van de gebruiker
  const [step, setStep] = useState(STEPS.media)
  const [mediaType, setMediaType] = useState(null)
  const [genres, setGenres] = useState([])
  const [genresLoading, setGenresLoading] = useState(false)
  const [likedGenre, setLikedGenre] = useState(null)
  const [excludedGenre, setExcludedGenre] = useState(null)

  // zoekveld en gekozen persoon bij vraag 4
  const [personQuery, setPersonQuery] = useState('')
  const [personResults, setPersonResults] = useState([])
  const [personSearching, setPersonSearching] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)

  // suggestie, eerder getoonde titels, en laad-/foutstatus
  const [suggestion, setSuggestion] = useState(null)
  const [pool, setPool] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [shownIds, setShownIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // haalt genres op zodra film of serie is gekozen
  useEffect(() => {
    if (!mediaType) return

    let cancelled = false
    setGenresLoading(true)
    setGenres([])

    const loader = mediaType === 'tv' ? getTvGenres : getMovieGenres
    loader()
      .then((list) => {
        if (!cancelled) setGenres(list)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load genres. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setGenresLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mediaType])

  // zet alles terug naar de eerste vraag
  function resetWizard() {
    setStep(STEPS.media)
    setMediaType(null)
    setGenres([])
    setLikedGenre(null)
    setExcludedGenre(null)
    setPersonQuery('')
    setPersonResults([])
    setSelectedPerson(null)
    setSuggestion(null)
    setPool([])
    setPage(1)
    setTotalPages(1)
    setShownIds([])
    setLoading(false)
    setError('')
  }

  // slaat film of serie op en gaat naar de genre-vraag
  function chooseMedia(type) {
    setMediaType(type)
    setLikedGenre(null)
    setExcludedGenre(null)
    setError('')
    setStep(STEPS.likeGenre)
  }

  // slaat het gewenste genre op en gaat naar de uitsluit-vraag
  function chooseLikedGenre(genre) {
    setLikedGenre(genre)
    setExcludedGenre(null)
    setError('')
    setStep(STEPS.dislikeGenre)
  }

  // slaat het genre op dat de gebruiker niet wil zien
  function chooseExcludedGenre(genre) {
    setExcludedGenre(genre)
    setPersonQuery('')
    setPersonResults([])
    setSelectedPerson(null)
    setError('')
    setStep(STEPS.person)
  }

  // zoekt een acteur, actrice of regisseur op naam
  async function handlePersonSearch(event) {
    event.preventDefault()
    const text = personQuery.trim()
    if (!text) return

    setPersonSearching(true)
    setError('')
    try {
      const people = await searchPeople(text)
      setPersonResults(people.slice(0, 8))
      if (people.length === 0) {
        setError('No people found. Try another name or skip.')
      }
    } catch (err) {
      setPersonResults([])
      setError(err.message || 'People search failed. Please try again.')
    } finally {
      setPersonSearching(false)
    }
  }

  // haalt titels op bij de antwoorden en kiest er één die nog niet getoond is
  async function runSuggestion({
    person = selectedPerson,
    nextShownIds = [],
    existingPool = [],
    existingPage = 1,
    existingTotal = 1,
    reusePool = false,
  } = {}) {
    setLoading(true)
    setError('')
    setStep(STEPS.result)

    try {
      let currentPool = existingPool
      let currentPage = existingPage
      let currentTotal = existingTotal

      if (!reusePool || currentPool.length === 0) {
        const fetched = await fetchRandomPool({
          mediaType,
          withGenreId: likedGenre?.id,
          withoutGenreId: excludedGenre?.id,
          personId: person?.id,
        })
        currentPool = fetched.results
        currentPage = fetched.page
        currentTotal = fetched.totalPages
      }

      const picked = await pickSuggestion({
        mediaType,
        withGenreId: likedGenre?.id,
        withoutGenreId: excludedGenre?.id,
        personId: person?.id,
        pool: currentPool,
        page: currentPage,
        totalPages: currentTotal,
        shownIds: nextShownIds,
      })

      setPool(picked.pool)
      setPage(picked.page)
      setTotalPages(picked.totalPages)
      setShownIds(picked.shownIds)
      setSuggestion(picked.suggestion)

      if (!picked.suggestion) {
        setError('No matches for those filters. Try starting over with different answers.')
      }
    } catch (err) {
      setSuggestion(null)
      setError(err.message || 'Could not find a suggestion. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // slaat de persoon op (of null bij Skip) en start de suggestie
  function finishPerson(person) {
    setSelectedPerson(person)
    setShownIds([])
    runSuggestion({ person, nextShownIds: [] })
  }

  // zoekt een nieuwe titel met dezelfde antwoorden
  function tryAnother() {
    runSuggestion({
      person: selectedPerson,
      nextShownIds: shownIds,
      existingPool: pool,
      existingPage: page,
      existingTotal: totalPages,
      reusePool: true,
    })
  }

  // gaat één stap terug en maakt het antwoord van die stap leeg
  function goBack() {
    setError('')
    if (step === STEPS.likeGenre) {
      setMediaType(null)
      setStep(STEPS.media)
    } else if (step === STEPS.dislikeGenre) {
      setLikedGenre(null)
      setStep(STEPS.likeGenre)
    } else if (step === STEPS.person) {
      setExcludedGenre(null)
      setStep(STEPS.dislikeGenre)
    } else if (step === STEPS.result) {
      setSuggestion(null)
      setStep(STEPS.person)
    }
  }

  // genres voor vraag 3, zonder het genre dat al gekozen is
  const remainingGenres = likedGenre
    ? genres.filter((genre) => genre.id !== likedGenre.id)
    : genres

  return (
    <section id="randomize" className="randomize">
      <div className="randomize-box">
        <h2 className="randomize-title">Randomizer</h2>

        {/* vraag 1: film of serie */}
        {step === STEPS.media && (
          <div className="randomize-step">
            <p className="randomize-question">What would you like to watch?</p>
            <div className="randomize-choices">
              <button
                type="button"
                className="randomize-choice"
                onClick={() => chooseMedia('movie')}
              >
                Movie
              </button>
              <button
                type="button"
                className="randomize-choice"
                onClick={() => chooseMedia('tv')}
              >
                TV show
              </button>
            </div>
          </div>
        )}

        {/* vraag 2: gewenst genre */}
        {step === STEPS.likeGenre && (
          <div className="randomize-step">
            <p className="randomize-question">
              What kind of {mediaType === 'tv' ? 'show' : 'movie'} would you like to
              watch?
            </p>
            {genresLoading ? (
              <p className="randomize-message">Loading genres…</p>
            ) : (
              <div className="randomize-genres" role="group" aria-label="Genres">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    className="randomize-genre-link"
                    onClick={() => chooseLikedGenre(genre)}
                  >
                    #{genre.name.replace(/\s+/g, '')}
                  </button>
                ))}
              </div>
            )}
            <div className="randomize-nav">
              <Button size="small" onClick={goBack}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* vraag 3: genre dat de gebruiker niet wil */}
        {step === STEPS.dislikeGenre && (
          <div className="randomize-step">
            <p className="randomize-question">
              What kind of {mediaType === 'tv' ? 'show' : 'movie'} would you
              definitely NOT want to see?
            </p>
            <div className="randomize-genres" role="group" aria-label="Exclude genres">
              {remainingGenres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  className="randomize-genre-link"
                  onClick={() => chooseExcludedGenre(genre)}
                >
                  #{genre.name.replace(/\s+/g, '')}
                </button>
              ))}
            </div>
            <div className="randomize-nav">
              <Button size="small" onClick={goBack}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* vraag 4: optionele persoon, of overslaan */}
        {step === STEPS.person && (
          <div className="randomize-step">
            <p className="randomize-question">
              Is there anyone specific you would like to see (actor, actress, or
              director)?
            </p>

            <form className="randomize-person-form" onSubmit={handlePersonSearch}>
              <input
                className="randomize-person-input"
                type="text"
                value={personQuery}
                onChange={(e) => setPersonQuery(e.target.value)}
                placeholder="Search a name…"
                disabled={personSearching}
                aria-label="Search for a person"
              />
              <Button
                type="submit"
                size="small"
                disabled={personSearching || !personQuery.trim()}
              >
                Search
              </Button>
            </form>

            {personResults.length > 0 && (
              <div className="randomize-people" role="list">
                {personResults.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="randomize-person-chip"
                    onClick={() => finishPerson(person)}
                  >
                    {person.name}
                    {person.known_for_department
                      ? ` · ${person.known_for_department}`
                      : ''}
                  </button>
                ))}
              </div>
            )}

            <div className="randomize-nav">
              <Button size="small" onClick={goBack}>
                Back
              </Button>
              <Button size="small" onClick={() => finishPerson(null)}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* resultaat: één suggestie, of een nieuwe proberen */}
        {step === STEPS.result && (
          <div className="randomize-step randomize-result">
            <p className="randomize-question">Your suggestion</p>

            {loading && <p className="randomize-message">Finding something for you…</p>}

            {!loading && suggestion && (
              <div className="randomize-card">
                <ResultCard item={suggestion} />
              </div>
            )}

            {!loading && (
              <div className="randomize-nav">
                {suggestion && (
                  <Button size="small" onClick={tryAnother}>
                    Try another
                  </Button>
                )}
                <Button size="small" onClick={resetWizard}>
                  Start over
                </Button>
                <Button size="small" onClick={goBack}>
                  Back
                </Button>
              </div>
            )}
          </div>
        )}

        {error && <p className="randomize-message randomize-error">{error}</p>}
      </div>
    </section>
  )
}

export default Randomize
