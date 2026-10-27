import { discoverByPerson, discoverRandom } from './API/tmdb.js'

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
 * With a person: use that person's credits (TV discover ignores with_people).
 * Never drops the person filter — only loosens genres if needed.
 */
export async function fetchRandomPool({
  mediaType,
  withGenreId,
  withoutGenreId,
  personId,
  preferredPage,
}) {
  // persoon gekozen: credits ophalen i.p.v. discover with_people
  if (personId) {
    let data = await discoverByPerson({
      mediaType,
      personId,
      withGenreId,
      withoutGenreId,
    })

    // te streng: eerst "niet dit genre" loslaten, daarna het gewenste genre
    if (data.results.length === 0 && withoutGenreId) {
      data = await discoverByPerson({
        mediaType,
        personId,
        withGenreId,
        withoutGenreId: null,
      })
    }
    if (data.results.length === 0 && withGenreId) {
      data = await discoverByPerson({
        mediaType,
        personId,
        withGenreId: null,
        withoutGenreId: null,
      })
    }

    return {
      results: data.results || [],
      totalPages: 1,
      page: 1,
    }
  }

  const base = {
    mediaType,
    withGenreId,
    withoutGenreId,
  }

  let page = preferredPage || 1
  let data = await discoverRandom({ ...base, page })

  // willekeurige pagina als we de totale omvang nog niet kenden
  if (!preferredPage && data.totalPages > 1) {
    page = randomPage(data.totalPages)
    if (page !== 1) {
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
    // bij een persoon is er maar één "pagina" (alle credits) — opnieuw schudden
    if (personId) {
      if (currentPool.length > 0) {
        shown.clear()
        unused = [...currentPool]
      }
    } else {
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
