import { discoverRandom } from './api/tmdb'

const MAX_PAGE = 20

function pickRandom(items) {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)]
}

function randomPage(totalPages) {
  const max = Math.min(Math.max(totalPages, 1), MAX_PAGE)
  return Math.floor(Math.random() * max) + 1
}

/**
 * Fetch a pool of discover results for the Randomizer filters.
 * If a person filter returns nothing, retries once without with_people.
 */
export async function fetchRandomPool({
  mediaType,
  withGenreId,
  withoutGenreId,
  personId,
  preferredPage,
}) {
  const base = {
    mediaType,
    withGenreId,
    withoutGenreId,
  }

  let page = preferredPage || 1
  let data = await discoverRandom({ ...base, personId, page })

  // Probe total pages with page 1 if we need a random page and don't know yet
  if (!preferredPage && data.totalPages > 1) {
    page = randomPage(data.totalPages)
    if (page !== 1) {
      data = await discoverRandom({ ...base, personId, page })
    }
  }

  if ((!data.results || data.results.length === 0) && personId) {
    data = await discoverRandom({ ...base, page: preferredPage || randomPage(1) })
    if (!preferredPage && data.totalPages > 1) {
      page = randomPage(data.totalPages)
      data = await discoverRandom({ ...base, page })
    }
  }

  return {
    results: data.results || [],
    totalPages: data.totalPages || 1,
    page: data.page || page,
  }
}

/**
 * Pick one unused item from the pool; if none left, fetch another page.
 * Returns { suggestion, pool, page, shownIds } or { suggestion: null, ... }.
 */
export async function pickSuggestion({
  mediaType,
  withGenreId,
  withoutGenreId,
  personId,
  pool,
  page,
  totalPages,
  shownIds,
}) {
  const shown = new Set(shownIds)
  let currentPool = pool || []
  let currentPage = page || 1
  let currentTotal = totalPages || 1

  let unused = currentPool.filter((item) => item?.id != null && !shown.has(item.id))

  if (unused.length === 0) {
    // Try other pages first
    const tried = new Set([currentPage])
    const max = Math.min(currentTotal, MAX_PAGE)

    while (unused.length === 0 && tried.size < max) {
      let nextPage
      do {
        nextPage = randomPage(currentTotal)
      } while (tried.has(nextPage) && tried.size < max)
      tried.add(nextPage)

      const fresh = await fetchRandomPool({
        mediaType,
        withGenreId,
        withoutGenreId,
        personId,
        preferredPage: nextPage,
      })
      currentPool = fresh.results
      currentPage = fresh.page
      currentTotal = fresh.totalPages
      unused = currentPool.filter((item) => item?.id != null && !shown.has(item.id))
    }

    // Exhausted — clear shown and reshuffle current pool
    if (unused.length === 0 && currentPool.length > 0) {
      shown.clear()
      unused = [...currentPool]
    }
  }

  const suggestion = pickRandom(unused)
  if (suggestion?.id != null) {
    shown.add(suggestion.id)
  }

  return {
    suggestion,
    pool: currentPool,
    page: currentPage,
    totalPages: currentTotal,
    shownIds: [...shown],
  }
}
