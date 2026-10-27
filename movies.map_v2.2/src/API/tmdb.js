// Base URL for the TMDB API (version 3)
const API_BASE = 'https://api.themoviedb.org/3'

// Base URL for movie posters (w342 = medium size)
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

// Wider backdrop image for the faded page background
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

// Smaller portrait image for cast photos
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

// Turns a TMDB poster path into a full image URL (or null if there is no poster)
export function posterUrl(posterPath) {
  if (!posterPath) return null
  return IMAGE_BASE + posterPath
}

  // zet een TMCB image om in een brakground image URL
export function backdropUrl(backdropPath) {
  if (!backdropPath) return null
  return BACKDROP_BASE + backdropPath
}

// zet een TMCB image om in een profiel-image URL
export function profileUrl(profilePath) {
  if (!profilePath) return null
  return PROFILE_BASE + profilePath
}

// Session cache for "Did you mean" title suggestions
let suggestionTitlesCache = null
let suggestionTitlesPromise = null

// Builds TMDB list URLs for a path + page range (used by getSuggestionTitles)
function suggestionListUrls(apiKey, path, pages) {
  const urls = []
  for (let page = 1; page <= pages; page++) {
    urls.push(
      API_BASE +
        path +
        '?api_key=' +
        apiKey +
        '&language=en-US&page=' +
        page
    )
  }
  return urls
}

// Fetches a broad title list once per session for typo suggestions
export async function getSuggestionTitles() {
  if (suggestionTitlesCache) return suggestionTitlesCache
  if (suggestionTitlesPromise) return suggestionTitlesPromise

  suggestionTitlesPromise = (async () => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (!apiKey) {
      throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
    }

    // top_rated covers classics (e.g. Inception); popular/trending cover what's current
    const urls = [
      ...suggestionListUrls(apiKey, '/movie/top_rated', 5),
      ...suggestionListUrls(apiKey, '/movie/popular', 3),
      ...suggestionListUrls(apiKey, '/trending/movie/week', 2),
    ]

    let responses
    try {
      responses = await Promise.all(urls.map((url) => fetch(url)))
    } catch {
      throw new Error('Could not reach TMDB. Check your connection and try again.')
    }

    if (responses.some((response) => !response.ok)) {
      throw new Error('Could not load movie title suggestions. Please try again.')
    }

    const datasets = await Promise.all(responses.map((response) => response.json()))

    const titles = []
    const seen = new Set()

    for (const data of datasets) {
      for (const movie of data.results || []) {
        const title = movie.title && movie.title.trim()
        if (!title) continue
        const key = title.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        titles.push(title)
      }
    }

    suggestionTitlesCache = titles
    return titles
  })()

  try {
    return await suggestionTitlesPromise
  } catch (err) {
    suggestionTitlesPromise = null
    throw err
  }
}

// gedeelde fetch helper voor TMDB GET-aanvragen
async function tmdbGet(pathWithQuery, errorMessage) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const joiner = pathWithQuery.includes('?') ? '&' : '?'
  const url = API_BASE + pathWithQuery + joiner + 'api_key=' + apiKey

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return await response.json()
}

// zoekt naar films die overeenkomen met de gegeven titel
export async function searchMovies(query) {
  const text = query.trim()
  if (!text) return []

  const data = await tmdbGet(
    '/search/movie?query=' +
      encodeURIComponent(text) +
      '&include_adult=false&language=en-US&page=1',
    'Movie search failed. Please try again.'
  )

  return (data.results || []).map((item) => ({ ...item, media_type: 'movie' }))
}

// zoekt naar tv-series die overeenkomen met de gegeven titel
export async function searchTv(query) {
  const text = query.trim()
  if (!text) return []

  const data = await tmdbGet(
    '/search/tv?query=' +
      encodeURIComponent(text) +
      '&include_adult=false&language=en-US&page=1',
    'TV search failed. Please try again.'
  )

  return (data.results || []).map((item) => ({ ...item, media_type: 'tv' }))
}

// zoekt naar personen (acteurs, regisseurs, enzovoort)
export async function searchPeople(query) {
  const text = query.trim()
  if (!text) return []

  const data = await tmdbGet(
    '/search/person?query=' +
      encodeURIComponent(text) +
      '&include_adult=false&language=en-US&page=1',
    'People search failed. Please try again.'
  )

  return (data.results || [])
    .filter((item) => item.adult !== true)
    .map((item) => ({ ...item, media_type: 'person' }))
}

// laadt de film-genre lijst van TMDB (eenmalig cachebaar via de caller)
export async function getMovieGenres() {
  const data = await tmdbGet(
    '/genre/movie/list?language=en-US',
    'Could not load genres. Please try again.'
  )
  return data.genres || []
}

// laadt de tv-genre lijst van TMDB
export async function getTvGenres() {
  const data = await tmdbGet(
    '/genre/tv/list?language=en-US',
    'Could not load genres. Please try again.'
  )
  return data.genres || []
}

// ontdekt films uit een specifiek releasejaar
export async function discoverMoviesByYear(year) {
  const yearText = String(year).trim()
  if (!/^\d{4}$/.test(yearText)) {
    throw new Error('Enter a 4-digit year (e.g. 1999).')
  }

  const data = await tmdbGet(
    '/discover/movie?primary_release_year=' +
      yearText +
      '&include_adult=false&language=en-US&sort_by=popularity.desc&page=1',
    'Year search failed. Please try again.'
  )

  return (data.results || []).map((item) => ({ ...item, media_type: 'movie' }))
}

// ontdekt films in een specifiek genre (TMDB genre id)
export async function discoverMoviesByGenre(genreId) {
  if (!genreId) return []

  const data = await tmdbGet(
    '/discover/movie?with_genres=' +
      genreId +
      '&include_adult=false&language=en-US&sort_by=popularity.desc&page=1',
    'Genre search failed. Please try again.'
  )

  return (data.results || []).map((item) => ({ ...item, media_type: 'movie' }))
}

/**
 * Discover movies or TV with Randomizer filters (genres only — no person).
 * @param {{ mediaType: 'movie'|'tv', withGenreId?: number|string, withoutGenreId?: number|string, page?: number }} params
 * @returns {Promise<{ results: object[], totalPages: number, page: number }>}
 */
export async function discoverRandom({
  mediaType,
  withGenreId,
  withoutGenreId,
  page = 1,
}) {
  const path = mediaType === 'tv' ? '/discover/tv' : '/discover/movie'
  const type = mediaType === 'tv' ? 'tv' : 'movie'

  let query =
    path +
    '?include_adult=false&language=en-US&sort_by=popularity.desc&page=' +
    Math.max(1, page)

  if (withGenreId) {
    query += '&with_genres=' + encodeURIComponent(String(withGenreId))
  }
  if (withoutGenreId) {
    query += '&without_genres=' + encodeURIComponent(String(withoutGenreId))
  }

  const data = await tmdbGet(query, 'Could not find a suggestion. Please try again.')

  return {
    results: (data.results || []).map((item) => ({ ...item, media_type: type })),
    totalPages: data.total_pages || 1,
    page: data.page || page,
  }
}

// filtert de film-/tv-credits van één persoon (TMDB discover/tv negeert with_people)
export async function discoverByPerson({
  mediaType,
  personId,
  withGenreId,
  withoutGenreId,
}) {
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  const credits = await getPersonCombinedCredits(personId)
  const rows = [...(credits.cast || []), ...(credits.crew || [])]

  const seen = new Set()
  let items = []

  for (const item of rows) {
    if (!item?.id || seen.has(item.id)) continue
    if (item.adult === true) continue
    // combined_credits zet media_type; movie_credits/tv_credits niet altijd
    const itemType = item.media_type || type
    if (itemType !== type) continue
    seen.add(item.id)
    items.push({ ...item, media_type: type })
  }

  const liked = withGenreId != null ? Number(withGenreId) : null
  const excluded = withoutGenreId != null ? Number(withoutGenreId) : null

  if (Number.isFinite(liked)) {
    items = items.filter(
      (item) =>
        Array.isArray(item.genre_ids) && item.genre_ids.includes(liked),
    )
  }
  if (Number.isFinite(excluded)) {
    items = items.filter(
      (item) =>
        !Array.isArray(item.genre_ids) || !item.genre_ids.includes(excluded),
    )
  }

  items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

  return {
    results: items,
    totalPages: 1,
    page: 1,
  }
}

// zoekt films, tv-series en personen in één aanroep (geen adult content)
export async function searchMulti(query) {
  const text = query.trim()
  if (!text) return []

  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE +
    '/search/multi?query=' +
    encodeURIComponent(text) +
    '&api_key=' +
    apiKey +
    '&include_adult=false&language=en-US&page=1'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Search failed. Please try again.')
  }

  const data = await response.json()
  const allowed = new Set(['movie', 'tv', 'person'])

  // houd alleen movie / tv / person, en filter adult-items eruit
  return (data.results || []).filter(
    (item) =>
      allowed.has(item.media_type) &&
      item.adult !== true
  )
}

// laadt een film op basis v/zijn TMCD id
export async function getMovie(movieId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/movie/' + movieId + '?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load this movie. Please try again.')
  }

  return await response.json()
}

// laadt soortgelijke films als de TMDB title
export async function getSimilarMovies(movieId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE +
    '/movie/' +
    movieId +
    '/similar?api_key=' +
    apiKey +
    '&language=en-US&page=1'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load similar movies. Please try again.')
  }

  const data = await response.json()
  return data.results || []
}

    // laadt cast & crew voor een film (acteurs + regisseurs, enzovoort)
export async function getMovieCredits(movieId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  // (foutmelding) API key ontbreekt
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/movie/' + movieId + '/credits?api_key=' + apiKey + '&language=en-US'
    // (foutmelding) iets is mis gegaan op de server side
  
    let response
  try {
    response = await fetch(url)
  } catch {
    // (foutmelding) kon TMDB niet bereiken
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }
  

  if (!response.ok) {
    // (foutmelding) kon cast & crew niet laden
    throw new Error('Could not load the cast. Please try again.')
  }

  return await response.json()
}

// laadt een tv-serie op basis van zijn TMDB id
export async function getTvShow(tvId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/tv/' + tvId + '?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load this TV show. Please try again.')
  }

  return await response.json()
}

// laadt cast & crew voor een tv-serie
export async function getTvCredits(tvId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/tv/' + tvId + '/credits?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load the cast. Please try again.')
  }

  return await response.json()
}

// laadt alle afleveringen van één seizoen
export async function getTvSeason(tvId, seasonNumber) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE +
    '/tv/' +
    tvId +
    '/season/' +
    seasonNumber +
    '?api_key=' +
    apiKey +
    '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load this season. Please try again.')
  }

  return await response.json()
}

// voorkeuren voor soort video (eerste match wint onder gelijke)
const TRAILER_TYPE_RANK = {
  Trailer: 0,
  Teaser: 1,
  Clip: 2,
}

// kiest de beste YouTube watch URL vanuit een TMDB videos.results array
export function pickTrailerUrl(videos) {
  if (!videos || videos.length === 0) return null

  const youtube = videos.filter(
    (video) => video && video.site === 'YouTube' && video.key
  )
  if (youtube.length === 0) return null

  youtube.sort((a, b) => {
    const rankA = TRAILER_TYPE_RANK[a.type]
    const rankB = TRAILER_TYPE_RANK[b.type]
    const typeA = rankA === undefined ? 99 : rankA
    const typeB = rankB === undefined ? 99 : rankB
    if (typeA !== typeB) return typeA - typeB

    const officialA = a.official ? 0 : 1
    const officialB = b.official ? 0 : 1
    return officialA - officialB
  })

  return 'https://www.youtube.com/watch?v=' + youtube[0].key
}

// YouTube search fallback voor als TMDB geen trailer heeft
export function youtubeTrailerSearchUrl(title) {
  const query = ((title || '').trim() + ' trailer').trim()
  return (
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
  )
}

// laadt trailers / teasers voor een film
export async function getMovieVideos(movieId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/movie/' + movieId + '/videos?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load trailers. Please try again.')
  }

  const data = await response.json()
  return data.results || []
}

// laadt trailers / teasers voor een tv-serie
export async function getTvVideos(tvId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/tv/' + tvId + '/videos?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load trailers. Please try again.')
  }

  const data = await response.json()
  return data.results || []
}

// laadt een persoon (acteur / regisseur) op basis van zijn TMDB id
export async function getPerson(personId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE + '/person/' + personId + '?api_key=' + apiKey + '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load this person. Please try again.')
  }

  return await response.json()
}

// laadt film- en tv-credits voor een persoon (cast + crew)
export async function getPersonCombinedCredits(personId) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  const url =
    API_BASE +
    '/person/' +
    personId +
    '/combined_credits?api_key=' +
    apiKey +
    '&language=en-US'

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error('Could not load credits. Please try again.')
  }

  return await response.json()
}

// --- Where to watch (JustWatch via TMDB) ---

const WATCH_REGION_KEY = 'watchRegion'
const PROVIDER_LOGO_BASE = 'https://image.tmdb.org/t/p/w92'

const OFFER_LABELS = {
  flatrate: 'Stream',
  free: 'Free',
  ads: 'Free with ads',
  rent: 'Rent',
  buy: 'Buy',
}

const FALLBACK_REGIONS = [
  'US',
  'GB',
  'NL',
  'DE',
  'FR',
  'CA',
  'AU',
  'BE',
  'ES',
  'IT',
  'SE',
  'BR',
  'MX',
  'JP',
  'IN',
]

const regionNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

let watchRegionsRequest = null

export function watchRegionName(code) {
  if (!code) return ''
  try {
    return regionNames?.of(code) || code
  } catch {
    return code
  }
}

function toRegionOptions(codes) {
  return [...new Set(codes.filter(Boolean))]
    .map((code) => ({
      code: String(code).toUpperCase(),
      name: watchRegionName(String(code).toUpperCase()),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

export function getFallbackWatchRegions() {
  return toRegionOptions(FALLBACK_REGIONS)
}

// laatst gekozen land, of browser-regio, of US
export function getSavedWatchRegion() {
  try {
    const saved = localStorage.getItem(WATCH_REGION_KEY)
    if (saved && /^[A-Z]{2}$/.test(saved)) return saved
  } catch {
    // private browsing kan storage blokkeren
  }
  const region = navigator.language?.split('-')[1]
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : 'US'
}

export function saveWatchRegion(region) {
  try {
    localStorage.setItem(WATCH_REGION_KEY, region)
  } catch {
    // negeer storage-fouten
  }
}

export function providerLogoUrl(logoPath) {
  if (!logoPath) return null
  return PROVIDER_LOGO_BASE + logoPath
}

// zet TMDB watch/providers om naar { US: { link, providers }, ... }
function normalizeWatchProviders(watchProviders) {
  const regions = {}

  for (const [code, offers] of Object.entries(watchProviders?.results ?? {})) {
    const providers = new Map()

    for (const [offerType, label] of Object.entries(OFFER_LABELS)) {
      for (const provider of offers?.[offerType] ?? []) {
        if (!provider?.provider_id) continue
        const known = providers.get(provider.provider_id)
        if (known) {
          if (!known.offers.includes(label)) known.offers.push(label)
          continue
        }
        providers.set(provider.provider_id, {
          id: provider.provider_id,
          name: provider.provider_name,
          logoPath: provider.logo_path,
          offers: [label],
        })
      }
    }

    const list = [...providers.values()]
    // Stream/Free eerst, daarna Rent/Buy
    list.sort((a, b) => {
      const rank = (offers) => {
        if (offers.includes('Stream') || offers.includes('Free') || offers.includes('Free with ads')) {
          return 0
        }
        if (offers.includes('Rent')) return 1
        return 2
      }
      const diff = rank(a.offers) - rank(b.offers)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name, 'en')
    })

    regions[code.toUpperCase()] = {
      link: offers?.link || null,
      providers: list,
    }
  }

  return regions
}

// landlijst voor de dropdown (één keer per sessie cachen)
export function getWatchRegions() {
  if (!watchRegionsRequest) {
    watchRegionsRequest = tmdbGet(
      '/watch/providers/regions?language=en-US',
      'Could not load watch regions.',
    )
      .then((data) => {
        const codes = (data.results ?? []).map((region) =>
          region.iso_3166_1?.toUpperCase(),
        )
        return toRegionOptions(codes.length ? codes : FALLBACK_REGIONS)
      })
      .catch(() => {
        watchRegionsRequest = null
        return getFallbackWatchRegions()
      })
  }
  return watchRegionsRequest
}

// haalt aanbieders per land op voor een film of serie
export async function getWatchProviders(mediaType, mediaId) {
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  const data = await tmdbGet(
    `/${type}/${mediaId}/watch/providers`,
    'Could not load watch options.',
  )
  return normalizeWatchProviders(data)
}
