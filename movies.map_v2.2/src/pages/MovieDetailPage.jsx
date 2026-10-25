import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import DetailPage from '../components/DetailPage'
import {
  getMovie,
  getMovieCredits,
  getMovieVideos,
  pickTrailerUrl,
  youtubeTrailerSearchUrl,
  posterUrl,
  backdropUrl,
  profileUrl,
} from '../api/tmdb'
import './MovieDetailPage.css'

// zet een datum als "2018-04-25" om in een leesbare datum zoals: "April 25, 2018"
function formatReleaseDate(dateText) {
  if (!dateText) return ''
  const date = new Date(dateText + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return dateText
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// zet 149 minuten om in "2h 29m"
function formatRuntime(minutes) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return rest + 'm'
  if (rest === 0) return hours + 'h'
  return hours + 'h ' + rest + 'm'
}

// voegt komma's toe aan grote getallen: 33227 -> "33,227"
function formatCount(number) {
  return Number(number).toLocaleString('en-US')
}

// een film die word geladen van TMDB en toont deze met de gedeelde DetailPage component
function MovieDetailPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // de homepage snappt naar elke sectie. zet dat uit terwijl deze pagina open is.
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
    return () => {
      document.documentElement.classList.remove('no-snap')
    }
  }, [])

  // laadt deze film (en zijn cast) wanneer de id in de URL verandert
  useEffect(() => {
    let ignore = false

    async function loadMovie() {
      setLoading(true)
      setError(null)

      try {
        const movieData = await getMovie(movieId)

        // de pagina werkt nog steeds , zelfs als de credits-aanroep faalt
        let creditsData = null
        try {
          creditsData = await getMovieCredits(movieId)
        } catch {
          creditsData = null
        }

        if (ignore) return
        setMovie(movieData)
        setCredits(creditsData)
      } catch (err) {
        if (ignore) return
        setMovie(null)
        setCredits(null)
        setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadMovie()
    window.scrollTo(0, 0)

    return () => {
      ignore = true
    }
  }, [movieId])

  // 'Back' gaat naar de laatste pagina waarde user vandaan komt. Een directe link gaat terug naar Search.
  function goBack() {
    const index = window.history.state && window.history.state.idx
    if (index > 0) {
      navigate(-1)
    } else {
      navigate('/#search')
    }
  }

  // Dead link for now — watchlist comes later
  function doNothing(event) {
    event.preventDefault()
  }

  function openPerson(item) {
    if (!item) return
    navigate('/person/' + item.id)
  }

  // Opens the TMDB trailer on YouTube, or a YouTube search if none is listed
  async function watchTrailer() {
    if (!movie) return

    let url = youtubeTrailerSearchUrl(movie.title)
    try {
      const videos = await getMovieVideos(movieId)
      const trailerUrl = pickTrailerUrl(videos)
      if (trailerUrl) url = trailerUrl
    } catch {
      // keep search fallback
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // regisseurs vanuit de crew-lijst (job moet exact "Director" zijn)
  const directors = credits && credits.crew
    ? credits.crew
        .filter((person) => person.job === 'Director')
        .map((person) => person.name)
    : []

  // eerste 12 cast-leden voor de card-grid
  const cast = credits && credits.cast
    ? credits.cast.slice(0, 12).map((person) => ({
        id: person.id,
        image: profileUrl(person.profile_path),
        title: person.name,
        info: person.character,
      }))
    : []

  // opbouw v/d extra info-lijst, en alles dat dat ontbreekt word overgeslagen
  const facts = []
  if (movie) {
    if (movie.release_date) {
      facts.push({
        label: 'Release date',
        value: formatReleaseDate(movie.release_date),
      })
    }
    if (directors.length > 0) {
      facts.push({
        label: directors.length === 1 ? 'Director' : 'Directors',
        value: directors.join(', '),
      })
    }
    if (movie.runtime) {
      facts.push({
        label: 'Runtime',
        value: formatRuntime(movie.runtime),
      })
    }
    if (movie.genres && movie.genres.length > 0) {
      facts.push({
        label: 'Genres',
        value: movie.genres.map((genre) => genre.name).join(', '),
      })
    }
  }

  const rating =
    movie && movie.vote_average
      ? {
          score: movie.vote_average.toFixed(1),
          count: formatCount(movie.vote_count),
        }
      : null

  const backdrop = movie ? backdropUrl(movie.backdrop_path) : null

  return (
    <main className="movie-detail">
      {/* faded movie-image background */}
      {backdrop && (
        <div
          className="movie-detail-backdrop"
          style={{ backgroundImage: 'url(' + backdrop + ')' }}
        />
      )}

      <div className="movie-detail-inner">
        <Button onClick={goBack}>Back</Button>

        {error && <p className="movie-detail-message">{error}</p>}
        {!error && loading && <p className="movie-detail-message">Loading...</p>}

        {!error && !loading && movie && (
          <DetailPage
            image={posterUrl(movie.poster_path)}
            title={movie.title}
            tagline={movie.tagline}
            facts={facts}
            rating={rating}
            actions={
              <>
                <Button onClick={doNothing}>Add to Watchlist</Button>
                <Button onClick={watchTrailer}>Watch Trailer</Button>
              </>
            }
            textTitle="Storyline"
            text={movie.overview}
            relatedTitle="Cast"
            related={cast}
            onRelatedClick={openPerson}
          />
        )}
      </div>
    </main>
  )
}

export default MovieDetailPage
