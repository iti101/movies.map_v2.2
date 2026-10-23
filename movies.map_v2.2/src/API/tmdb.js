// Base URL for the TMDB API (version 3)
const API_BASE = 'https://api.themoviedb.org/3'

// Base URL for movie posters (w342 = medium size)
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

// Turns a TMDB poster path into a full image URL (or null if there is no poster)
export function posterUrl(posterPath) {
  if (!posterPath) return null
  return IMAGE_BASE + posterPath
}

// Searches TMDB for movies that match the given title
export async function searchMovies(query) {
  // remove spaces at the start and end
  const text = query.trim()
  if (!text) return []

  // API key from the .env file (must start with VITE_ to work in the browser)
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) {
    throw new Error('Missing TMDB API key. Add VITE_TMDB_API_KEY to your .env file.')
  }

  // build the full request URL with the search text and the key
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
