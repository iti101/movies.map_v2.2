// Remembers the last search while the app is open.
// Useful when the user opens a movie and then presses Back.

let savedQuery = ''
let savedResults = []
let savedSearched = false

export function saveSearch(query, results, searched) {
  savedQuery = query
  savedResults = results
  savedSearched = searched
}

export function loadSearch() {
  return {
    query: savedQuery,
    results: savedResults,
    searched: savedSearched,
  }
}
