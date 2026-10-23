// onthoud de laatste zoekopdracht en resultaten terwijl de app open is.

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
