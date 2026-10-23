import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import DetailPage from '../components/DetailPage'
import {
  getMovie,
  getMovieCredits,
  posterUrl,
  backdropUrl,
  profileUrl,
} from '../api/tmdb'
import './MovieDetailPage.css'

// Turns "2018-04-25" into a readable date like "April 25, 2018"
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

// Turns 149 minutes into "2h 29m"
function formatRuntime(minutes) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return rest + 'm'
  if (rest === 0) return hours + 'h'
  return hours + 'h ' + rest + 'm'
}

// Adds commas to big numbers: 33227 -> "33,227"
function formatCount(number) {
  return Number(number).toLocaleString('en-US')
}

// One movie: loads it from TMDB and shows it with the shared DetailPage
function MovieDetailPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // The home page snaps each section. Turn that off while this page is open.
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
    return () => {
      document.documentElement.classList.remove('no-snap')
    }
  }, [])

  // Load this movie (and its cast) whenever the id in the URL changes
  useEffect(() => {
    let ignore = false

    async function loadMovie() {
      setLoading(true)
      setError(null)

      try {
        const movieData = await getMovie(movieId)

        // The page still works if the credits call fails
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

  // Back goes to the page they came from. A direct link falls back to Search.
  function goBack() {
    const index = window.history.state && window.history.state.idx
    if (index > 0) {
      navigate(-1)
    } else {
      navigate('/#search')
    }
  }

  // Dead link for now — watchlist / trailer come later
  function doNothing(event) {
    event.preventDefault()
  }

  // Directors from the crew list (job must be exactly "Director")
  const directors = credits && credits.crew
    ? credits.crew
        .filter((person) => person.job === 'Director')
        .map((person) => person.name)
    : []

  // First 12 cast members for the card grid
  const cast = credits && credits.cast
    ? credits.cast.slice(0, 12).map((person) => ({
        id: person.id,
        image: profileUrl(person.profile_path),
        title: person.name,
        info: person.character,
      }))
    : []

  // Build the fact rows, and skip anything that is missing
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
      {/* Faded backdrop behind the top of the page */}
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
                <Button onClick={doNothing}>Watch Trailer</Button>
              </>
            }
            textTitle="Storyline"
            text={movie.overview}
            relatedTitle="Cast"
            related={cast}
          />
        )}
      </div>
    </main>
  )
}

export default MovieDetailPage
