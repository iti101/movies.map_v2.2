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

// zoekt naar films die overeenkomen met de gegeven titel
export async function searchMovies(query) {
  // verwijder spaties aan het begin en einde
  const text = query.trim()
  if (!text) return []

  // API key vanuit de .env file (moet beginnen met: "VITE_" om in de browser te werken)
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  // bouw de volledige aanvraag URL met de zoektekst en de key
  const url =
    API_BASE +
    '/search/movie?query=' +
    encodeURIComponent(text) +
    '&api_key=' +
    apiKey +
    '&include_adult=false&language=en-US&page=1'

  // try to call the API
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Could not reach TMDB. Check your connection and try again.')
  }

  // something went wrong on the server side
  if (!response.ok) {
    throw new Error('Movie search failed. Please try again.')
  }

  // turn the JSON response into a normal JavaScript object
  const data = await response.json()

  // TMDB puts the movies in a "results" array
  return data.results || []
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
