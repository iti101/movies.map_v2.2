const API_BASE =
  import.meta.env.VITE_NOVI_API_URL ||
  'https://novi-backend-api-wgsgz.ondigitalocean.app'
const PROJECT_ID = import.meta.env.VITE_NOVI_PROJECT_ID

// standaard headers voor NOVI-requests (project-id is verplicht)
export function noviHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    'novi-education-project-id': PROJECT_ID,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// logt in via POST /api/login; geeft { token, user } terug of gooit een Error
export async function login({ email, password }) {
  if (!PROJECT_ID) {
    throw new Error('NOVI project ID is missing. Set VITE_NOVI_PROJECT_ID in .env')
  }

  let response
  try {
    response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: noviHeaders(),
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw networkError('Login')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (response.status === 401
        ? 'Invalid email or password'
        : 'Login failed. Please try again.')
    throw new Error(message)
  }

  if (!data?.token) {
    throw new Error('Login failed. No token received.')
  }

  return data
}

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function requireProjectId() {
  if (!PROJECT_ID) {
    throw new Error('NOVI project ID is missing. Set VITE_NOVI_PROJECT_ID in .env')
  }
}

function networkError(action) {
  return new Error(
    `${action} failed to reach the NOVI API. Use http://localhost:5173 (NOVI CORS blocks other ports).`,
  )
}

// maakt een nieuw auth-account aan via POST /api/users
export async function registerUser({ email, password }) {
  requireProjectId()

  let response
  try {
    response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: noviHeaders(),
      body: JSON.stringify({
        email,
        password,
        roles: ['user'],
      }),
    })
  } catch {
    throw networkError('Create account')
  }

  const data = await parseJson(response)

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (response.status === 409
        ? 'An account with this email already exists.'
        : 'Could not create account. Please try again.')
    throw new Error(message)
  }

  if (!data?.id) {
    throw new Error('Could not create account. No user id received.')
  }

  return data
}

// koppelt een username aan de gebruiker via POST /api/profiles
export async function createProfile({ userId, username, token }) {
  requireProjectId()

  const response = await fetch(`${API_BASE}/api/profiles`, {
    method: 'POST',
    headers: noviHeaders(token),
    body: JSON.stringify({ userId, username }),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      'Account created, but profile could not be saved.'
    throw new Error(message)
  }

  return data
}

function asList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.reviews)) return data.reviews
  return []
}

// haalt de watchlists van de ingelogde gebruiker op
export async function getMyWatchlists(token, userId) {
  requireProjectId()

  if (!userId) {
    throw new Error('Could not load watchlists. No user id.')
  }

  // eerst via /users/{id}/watchlists (werkt alleen als die user nog bestaat)
  const response = await fetch(`${API_BASE}/api/users/${userId}/watchlists`, {
    method: 'GET',
    headers: noviHeaders(token),
  })

  const data = await parseJson(response)

  if (response.ok) {
    return asList(data)
  }

  // fallback na config-upload: user-id bestaat niet meer, filter zelf op userId
  const allResponse = await fetch(`${API_BASE}/api/watchlists`, {
    method: 'GET',
    headers: noviHeaders(token),
  })

  const allData = await parseJson(allResponse)

  if (!allResponse.ok) {
    throw new Error(
      apiErrorMessage(
        data || allData,
        'Could not load watchlists. Please sign out and create a new account.',
      ),
    )
  }

  return asList(allData).filter(
    (list) => Number(list.userId) === Number(userId),
  )
}

// haalt alle watchlist-items op (of per watchlist via nested route)
export async function getWatchlistItems(token, watchlistId) {
  requireProjectId()

  const url =
    watchlistId != null
      ? `${API_BASE}/api/watchlists/${watchlistId}/watchlistItems`
      : `${API_BASE}/api/watchlistItems`

  const response = await fetch(url, {
    method: 'GET',
    headers: noviHeaders(token),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    throw new Error(
      apiErrorMessage(data, 'Could not load watchlist items.'),
    )
  }

  return asList(data)
}

// normaliseert een watchlist-item (camelCase of snake_case)
export function normalizeWatchlistItem(item) {
  if (!item || typeof item !== 'object') return null

  const mediaType = item.mediaType || item.media_type || 'movie'
  const mediaId = Number(item.mediaId ?? item.media_id)
  if (!Number.isFinite(mediaId)) return null

  const title = item.title || item.name || ''
  const posterPath = item.posterPath ?? item.poster_path ?? null
  const watchlistId = Number(item.watchlistId ?? item.watchlist_id)

  return {
    id: mediaId,
    media_type: mediaType === 'tv' ? 'tv' : 'movie',
    title: mediaType === 'tv' ? undefined : title,
    name: mediaType === 'tv' ? title : undefined,
    poster_path: posterPath,
    watchlistId: Number.isFinite(watchlistId) ? watchlistId : null,
    itemId: item.id ?? null,
  }
}

// zoekt of een watchlist zijn titels al in het object heeft zitten
function nestedItemsFromList(list) {
  if (Array.isArray(list?.items)) return list.items
  if (Array.isArray(list?.watchlistItems)) return list.watchlistItems
  if (Array.isArray(list?.watchlist_items)) return list.watchlist_items
  return null
}

// groepeert items per watchlistId; gebruikt geneste items als die er al zijn
export function groupItemsByWatchlist(lists, flatItems) {
  const grouped = {}

  for (const list of lists) {
    const nested = nestedItemsFromList(list)
    if (nested) {
      grouped[list.id] = nested
        .map(normalizeWatchlistItem)
        .filter(Boolean)
    } else {
      grouped[list.id] = []
    }
  }

  const anyNested = lists.some((list) => nestedItemsFromList(list) !== null)
  if (anyNested) return grouped

  for (const raw of flatItems || []) {
    const item = normalizeWatchlistItem(raw)
    if (!item || item.watchlistId == null) continue
    if (!grouped[item.watchlistId]) grouped[item.watchlistId] = []
    grouped[item.watchlistId].push(item)
  }

  return grouped
}

function apiErrorMessage(data, fallback) {
  if (!data) return fallback
  if (typeof data === 'string') return data
  return data.message || data.error || data.title || fallback
}

// maakt een nieuwe watchlist aan (createdAt weglaten: API vult die zelf in)
export async function createWatchlist({ userId, name, token }) {
  requireProjectId()

  const response = await fetch(`${API_BASE}/api/watchlists`, {
    method: 'POST',
    headers: noviHeaders(token),
    body: JSON.stringify({
      userId,
      name,
    }),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session expired. Please sign in again.')
    }
    throw new Error(apiErrorMessage(data, 'Could not create watchlist.'))
  }

  return data
}

// voegt een film/serie toe aan een watchlist
export async function addWatchlistItem({
  watchlistId,
  userId,
  mediaType,
  mediaId,
  title,
  posterPath,
  token,
}) {
  requireProjectId()

  const response = await fetch(`${API_BASE}/api/watchlistItems`, {
    method: 'POST',
    headers: noviHeaders(token),
    body: JSON.stringify({
      watchlistId,
      userId,
      mediaType,
      mediaId: Number(mediaId),
      title,
      posterPath: posterPath || null,
    }),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    throw new Error(
      apiErrorMessage(data, 'Could not add title to watchlist.'),
    )
  }

  return data
}

// haalt reviews op en filtert client-side op mediaType + mediaId
export async function getReviewsForMedia(mediaType, mediaId, token) {
  requireProjectId()

  if (!token) {
    return []
  }

  const response = await fetch(`${API_BASE}/api/reviews`, {
    method: 'GET',
    headers: noviHeaders(token),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session expired. Please sign in again.')
    }
    throw new Error(apiErrorMessage(data, 'Could not load reviews.'))
  }

  return asList(data)
    .filter(
      (review) =>
        review.mediaType === mediaType &&
        Number(review.mediaId) === Number(mediaId),
    )
    .sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    )
}

// publiceert een review voor een film/serie (rating 1–5 is optioneel)
export async function createReview({
  userId,
  mediaType,
  mediaId,
  text,
  rating,
  token,
}) {
  requireProjectId()

  const trimmed = text?.trim()
  if (!trimmed) {
    throw new Error('Write a short review before submitting.')
  }

  const score = Number(rating)

  const response = await fetch(`${API_BASE}/api/reviews`, {
    method: 'POST',
    headers: noviHeaders(token),
    body: JSON.stringify({
      userId,
      mediaType,
      mediaId: Number(mediaId),
      text: trimmed,
      ...(score >= 1 && score <= 5 ? { rating: score } : {}),
    }),
  })

  const data = await parseJson(response)

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session expired. Please sign in again.')
    }
    throw new Error(apiErrorMessage(data, 'Could not publish your review.'))
  }

  return data
}
