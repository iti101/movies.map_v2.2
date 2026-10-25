import {
  searchMovies,
  searchTv,
  searchPeople,
  discoverMoviesByYear,
  discoverMoviesByGenre,
} from './api/tmdb'

export const SEARCH_PLACEHOLDERS = {
  movies: 'Search movies...',
  tv: 'Search TV shows...',
  people: 'Search people...',
  year: 'Enter year (e.g. 1999)',
  genre: 'Search movies by title...',
}

// genre-modus: titelzoeken, optioneel gefilterd op geselecteerd genre
async function searchByGenre(text, genreId) {
  const trimmed = text.trim()

  // alleen genre: populaire films in dat genre
  if (!trimmed) {
    if (!genreId) return []
    return discoverMoviesByGenre(genreId)
  }

  // titel (+ optioneel genre-filter op de zoekresultaten)
  const movies = await searchMovies(trimmed)
  if (!genreId) return movies
  return movies.filter(
    (movie) =>
      Array.isArray(movie.genre_ids) && movie.genre_ids.includes(genreId)
  )
}

// roept de juiste TMDB endpoint aan op basis van de actieve filter
export async function fetchForFilter(activeFilter, text, genreId) {
  if (activeFilter === 'movies') return searchMovies(text)
  if (activeFilter === 'tv') return searchTv(text)
  if (activeFilter === 'people') return searchPeople(text)
  if (activeFilter === 'year') return discoverMoviesByYear(text)
  if (activeFilter === 'genre') return searchByGenre(text, genreId)
  return []
}
