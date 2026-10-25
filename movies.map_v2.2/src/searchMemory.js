// onthoud de laatste zoekopdracht en resultaten terwijl de app open is.

let savedQuery = ''
let savedResults = []
let savedSearched = false
let savedFilter = 'movies'
let savedGenreId = null

export function saveSearch(query, results, searched, filter, genreId) {
  savedQuery = query
  savedResults = results
  savedSearched = searched
  if (filter !== undefined) savedFilter = filter
  if (genreId !== undefined) savedGenreId = genreId
}

export function loadSearch() {
  return {
    query: savedQuery,
    results: savedResults,
    searched: savedSearched,
    filter: savedFilter,
    genreId: savedGenreId,
  }
}
