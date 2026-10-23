import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import DetailPage from '../components/DetailPage'
import {
  getTvShow,
  getTvCredits,
  getTvSeason,
  posterUrl,
  backdropUrl,
  profileUrl,
} from '../api/tmdb'
import './TvShowDetailPage.css'

// zet een datum als "2008-01-20" om in een leesbare datum zoals: "January 20, 2008"
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

// zet 58 minuten om in "58m"
function formatRuntime(minutes) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return rest + 'm'
  if (rest === 0) return hours + 'h'
  return hours + 'h ' + rest + 'm'
}

// voegt komma's toe aan grote getallen: 18913 -> "18,913"
function formatCount(number) {
  return Number(number).toLocaleString('en-US')
}

// kiest het eerste 'echte' seizoen (nummer >= 1), anders het eerste beschikbare
function pickDefaultSeason(seasons) {
  if (!seasons || seasons.length === 0) return null
  const regular = seasons.find((season) => season.season_number >= 1)
  return regular || seasons[0]
}

// een tv-serie die word geladen van TMDB en toont deze met de gedeelde DetailPage component
function TvShowDetailPage() {
  const { tvId } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [credits, setCredits] = useState(null)
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [episodesError, setEpisodesError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // de homepage snappt naar elke sectie. zet dat uit terwijl deze pagina open is.
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
    return () => {
      document.documentElement.classList.remove('no-snap')
    }
  }, [])

  // laadt deze serie (en zijn cast) wanneer de id in de URL verandert
  useEffect(() => {
    let ignore = false

    async function loadShow() {
      setLoading(true)
      setError(null)
      setSelectedSeason(null)
      setEpisodes([])
      setEpisodesError(null)

      try {
        const showData = await getTvShow(tvId)

        // de pagina werkt nog steeds, zelfs als de credits-aanroep faalt
        let creditsData = null
        try {
          creditsData = await getTvCredits(tvId)
        } catch {
          creditsData = null
        }

        if (ignore) return

        const seasons = (showData.seasons || []).filter(
          (season) => season.episode_count > 0
        )
        const defaultSeason = pickDefaultSeason(seasons)

        setShow(showData)
        setCredits(creditsData)
        setSelectedSeason(
          defaultSeason ? defaultSeason.season_number : null
        )
      } catch (err) {
        if (ignore) return
        setShow(null)
        setCredits(null)
        setSelectedSeason(null)
        setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadShow()
    window.scrollTo(0, 0)

    return () => {
      ignore = true
    }
  }, [tvId])

  // laadt de afleveringen wanneer het gekozen seizoen verandert
  useEffect(() => {
    if (selectedSeason === null || selectedSeason === undefined) return

    let ignore = false

    async function loadEpisodes() {
      setEpisodesLoading(true)
      setEpisodesError(null)

      try {
        const seasonData = await getTvSeason(tvId, selectedSeason)
        if (ignore) return
        setEpisodes(seasonData.episodes || [])
      } catch (err) {
        if (ignore) return
        setEpisodes([])
        setEpisodesError(err.message)
      } finally {
        if (!ignore) setEpisodesLoading(false)
      }
    }

    loadEpisodes()

    return () => {
      ignore = true
    }
  }, [tvId, selectedSeason])

  // 'Back' gaat naar de laatste pagina waar de user vandaan komt. Een directe link gaat terug naar Search.
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

  function onSeasonChange(event) {
    setSelectedSeason(Number(event.target.value))
  }

  // seizoenen met minstens één aflevering (inclusief specials)
  const seasons = show
    ? (show.seasons || []).filter((season) => season.episode_count > 0)
    : []

  // creators vanuit created_by op de show
  const creators = show && show.created_by
    ? show.created_by.map((person) => person.name)
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

  // opbouw v/d extra info-lijst, en alles dat ontbreekt word overgeslagen
  const facts = []
  if (show) {
    if (show.first_air_date) {
      facts.push({
        label: 'First aired',
        value: formatReleaseDate(show.first_air_date),
      })
    }
    if (show.genres && show.genres.length > 0) {
      facts.push({
        label: 'Genres',
        value: show.genres.map((genre) => genre.name).join(', '),
      })
    }
    if (creators.length > 0) {
      facts.push({
        label: 'Created by',
        value: creators.join(', '),
      })
    }
  }

  const rating =
    show && show.vote_average
      ? {
          score: show.vote_average.toFixed(1),
          count: formatCount(show.vote_count),
        }
      : null

  const backdrop = show ? backdropUrl(show.backdrop_path) : null

  return (
    <main className="tv-detail">
      {/* faded show-image background */}
      {backdrop && (
        <div
          className="tv-detail-backdrop"
          style={{ backgroundImage: 'url(' + backdrop + ')' }}
        />
      )}

      <div className="tv-detail-inner">
        <Button onClick={goBack}>Back</Button>

        {error && <p className="tv-detail-message">{error}</p>}
        {!error && loading && <p className="tv-detail-message">Loading...</p>}

        {!error && !loading && show && (
          <DetailPage
            image={posterUrl(show.poster_path)}
            title={show.name}
            tagline={show.tagline}
            facts={facts}
            rating={rating}
            actions={
              <>
                <Button onClick={doNothing}>Add to Watchlist</Button>
                <Button onClick={doNothing}>Watch Trailer</Button>
              </>
            }
            textTitle="Storyline"
            text={show.overview}
            relatedTitle="Cast"
            related={cast}
          >
            {seasons.length > 0 && (
              <section className="tv-episodes">
                <div className="tv-episodes-header">
                  <h2 className="detail-section-title">Episodes</h2>

                  <label className="tv-season-label">
                    <span className="tv-season-label-text">Season</span>
                    <select
                      className="tv-season-select"
                      value={selectedSeason ?? ''}
                      onChange={onSeasonChange}
                    >
                      {seasons.map((season) => (
                        <option
                          key={season.id}
                          value={season.season_number}
                        >
                          {season.season_number === 0
                            ? 'Specials'
                            : 'Season ' + season.season_number}
                          {' - '}
                          {season.episode_count}{' '}
                          {season.episode_count === 1
                            ? 'episode'
                            : 'episodes'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {episodesError && (
                  <p className="tv-detail-message">{episodesError}</p>
                )}
                {!episodesError && episodesLoading && (
                  <p className="tv-detail-message">Loading episodes...</p>
                )}
                {!episodesError && !episodesLoading && episodes.length === 0 && (
                  <p className="tv-detail-message">No episodes to show.</p>
                )}

                {!episodesError && !episodesLoading && episodes.length > 0 && (
                  <ul className="tv-episode-list">
                    {episodes.map((episode) => {
                      const dateText = formatReleaseDate(episode.air_date)
                      const runtimeText = formatRuntime(episode.runtime)
                      const meta =
                        dateText && runtimeText
                          ? dateText + ' - ' + runtimeText
                          : dateText || runtimeText

                      return (
                        <li key={episode.id} className="tv-episode">
                          <div className="tv-episode-main">
                            <span className="tv-episode-number">
                              E{episode.episode_number}
                            </span>
                            <span className="tv-episode-title">
                              {episode.name}
                            </span>
                          </div>
                          {meta && (
                            <span className="tv-episode-meta">{meta}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </DetailPage>
        )}
      </div>
    </main>
  )
}

export default TvShowDetailPage
