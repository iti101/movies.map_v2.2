import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import DetailPage from '../components/DetailPage'
import {
  getPerson,
  getPersonCombinedCredits,
  posterUrl,
  profileUrl,
} from '../api/tmdb'
import './PersonDetailPage.css'

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

// top titels uit cast + crew, op populariteit
function buildKnownFor(credits) {
  if (!credits) return []

  const cast = credits.cast || []
  const crew = credits.crew || []
  const seen = new Set()
  const items = []

  for (const credit of cast.concat(crew)) {
    const mediaType = credit.media_type
    if (mediaType !== 'movie' && mediaType !== 'tv') continue

    const key = mediaType + '-' + credit.id
    if (seen.has(key)) continue
    seen.add(key)

    const year =
      (credit.release_date || credit.first_air_date || '').slice(0, 4)

    items.push({
      id: credit.id,
      mediaType,
      image: posterUrl(credit.poster_path),
      title: credit.title || credit.name,
      info: year,
      popularity: credit.popularity || 0,
    })
  }

  return items
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 12)
    .map(({ popularity, ...item }) => item)
}

// een persoon die word geladen van TMDB en toont deze met de gedeelde DetailPage component
function PersonDetailPage() {
  const { personId } = useParams()
  const navigate = useNavigate()

  const [person, setPerson] = useState(null)
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

  // laadt deze persoon (en known-for) wanneer de id in de URL verandert
  useEffect(() => {
    let ignore = false

    async function loadPerson() {
      setLoading(true)
      setError(null)

      try {
        const personData = await getPerson(personId)

        // de pagina werkt nog steeds, zelfs als de credits-aanroep faalt
        let creditsData = null
        try {
          creditsData = await getPersonCombinedCredits(personId)
        } catch {
          creditsData = null
        }

        if (ignore) return
        setPerson(personData)
        setCredits(creditsData)
      } catch (err) {
        if (ignore) return
        setPerson(null)
        setCredits(null)
        setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadPerson()
    window.scrollTo(0, 0)

    return () => {
      ignore = true
    }
  }, [personId])

  // 'Back' gaat naar de laatste pagina waarde user vandaan komt. Een directe link gaat terug naar Search.
  function goBack() {
    const index = window.history.state && window.history.state.idx
    if (index > 0) {
      navigate(-1)
    } else {
      navigate('/#search')
    }
  }

  function openKnownFor(item) {
    if (!item) return
    if (item.mediaType === 'tv') {
      navigate('/tv/' + item.id)
    } else {
      navigate('/movie/' + item.id)
    }
  }

  const knownFor = buildKnownFor(credits)

  const facts = []
  if (person) {
    if (person.birthday) {
      facts.push({
        label: 'Date of birth',
        value: formatReleaseDate(person.birthday),
      })
    }
    if (person.place_of_birth) {
      facts.push({
        label: 'Place of birth',
        value: person.place_of_birth,
      })
    }
  }

  const profile = person ? profileUrl(person.profile_path) : null

  return (
    <main className="person-detail">
      {profile && (
        <div
          className="person-detail-backdrop"
          style={{ backgroundImage: 'url(' + profile + ')' }}
        />
      )}

      <div className="person-detail-inner">
        <Button onClick={goBack}>Back</Button>

        {error && <p className="person-detail-message">{error}</p>}
        {!error && loading && (
          <p className="person-detail-message">Loading...</p>
        )}

        {!error && !loading && person && (
          <DetailPage
            image={profile}
            title={person.name}
            facts={facts}
            textTitle="Biography"
            text={person.biography}
            relatedTitle="Known for"
            related={knownFor}
            onRelatedClick={openKnownFor}
          />
        )}
      </div>
    </main>
  )
}

export default PersonDetailPage
