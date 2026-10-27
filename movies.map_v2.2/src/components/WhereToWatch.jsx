import { useEffect, useId, useState } from 'react'
import {
  getFallbackWatchRegions,
  getSavedWatchRegion,
  getWatchProviders,
  getWatchRegions,
  providerLogoUrl,
  saveWatchRegion,
  watchRegionName,
} from '../API/tmdb.js'
import './Button.css'
import './WhereToWatch.css'

// toont streaming/huur/koop-opties per land (JustWatch via TMDB)
function WhereToWatch({ mediaType = 'movie', mediaId }) {
  const countryLabelId = useId()
  const [region, setRegion] = useState(getSavedWatchRegion)
  const [regions, setRegions] = useState(getFallbackWatchRegions)
  const [byRegion, setByRegion] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // landlijst voor de dropdown
  useEffect(() => {
    let ignore = false

    getWatchRegions().then((options) => {
      if (!ignore && options.length > 0) setRegions(options)
    })

    return () => {
      ignore = true
    }
  }, [])

  // providers voor deze titel
  useEffect(() => {
    let ignore = false

    async function loadProviders() {
      if (mediaId == null) {
        setByRegion({})
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const data = await getWatchProviders(mediaType, mediaId)
        if (!ignore) setByRegion(data)
      } catch (err) {
        if (!ignore) {
          setByRegion({})
          setError(err.message || 'Could not load watch options.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProviders()

    return () => {
      ignore = true
    }
  }, [mediaType, mediaId])

  const regionOptions = regions.some((option) => option.code === region)
    ? regions
    : [...regions, { code: region, name: watchRegionName(region) }].sort((a, b) =>
        a.name.localeCompare(b.name, 'en'),
      )

  const country =
    regionOptions.find((option) => option.code === region)?.name || region
  const watch = byRegion[region]
  const providers = watch?.providers || []
  const justWatchLink = watch?.link || null

  function handleRegionChange(event) {
    const next = event.target.value
    setRegion(next)
    saveWatchRegion(next)
  }

  return (
    <section className="where-to-watch">
      <div className="where-to-watch-header">
        <h2 className="detail-section-title">Where to watch</h2>
        <div className="where-to-watch-country">
          <label className="where-to-watch-country-label" htmlFor={countryLabelId}>
            Country
          </label>
          <select
            id={countryLabelId}
            className="where-to-watch-select"
            value={region}
            onChange={handleRegionChange}
          >
            {regionOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="where-to-watch-status">Loading watch options…</p>
      ) : error ? (
        <p className="where-to-watch-status where-to-watch-status-error">
          {error}
        </p>
      ) : providers.length === 0 ? (
        <p className="where-to-watch-status">
          No watch options found for {country}.
        </p>
      ) : (
        <>
          <ul className="where-to-watch-list">
            {providers.map((provider) => {
              const logo = providerLogoUrl(provider.logoPath)
              const className = 'button medium pill where-to-watch-provider'
              const label = (
                <>
                  {logo && (
                    <img
                      className="where-to-watch-logo"
                      src={logo}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span className="where-to-watch-provider-text">
                    <span className="where-to-watch-provider-name">
                      {provider.name}
                    </span>
                    {provider.offers?.length > 0 && (
                      <span className="where-to-watch-provider-offers">
                        {provider.offers.join(' · ')}
                      </span>
                    )}
                  </span>
                </>
              )

              if (justWatchLink) {
                return (
                  <li key={provider.id}>
                    <a
                      className={className}
                      href={justWatchLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {label}
                    </a>
                  </li>
                )
              }

              return (
                <li key={provider.id}>
                  <span className={`${className} is-static`}>{label}</span>
                </li>
              )
            })}
          </ul>
          <p className="where-to-watch-note">
            Availability for {country}, provided by JustWatch.
          </p>
        </>
      )}
    </section>
  )
}

export default WhereToWatch
