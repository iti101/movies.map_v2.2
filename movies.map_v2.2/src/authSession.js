const TOKEN_KEY = 'novi_token'
const USER_KEY = 'novi_user'

// haalt het payload-object uit een JWT (zonder verificatie; alleen voor id/email)
export function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

// zorgt dat user altijd een numerieke id heeft (uit response of JWT)
export function buildSessionUser(token, user = {}) {
  const payload = decodeJwtPayload(token) || {}
  const id = Number(user.id ?? payload.userId ?? payload.id ?? payload.sub)
  return {
    ...user,
    id: Number.isFinite(id) ? id : user.id,
    email: user.email || payload.email || null,
  }
}

// bewaart JWT en basis-userinfo na een succesvolle login
export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(buildSessionUser(token, user)))
  }
}

// true als de JWT geen geldige exp meer heeft
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  const expMs = payload.exp > 1e12 ? payload.exp : payload.exp * 1000
  return Date.now() >= expMs
}

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  if (isTokenExpired(token)) {
    clearSession()
    return null
  }
  return token
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getUserId() {
  const user = getUser()
  const fromUser = Number(user?.id)
  if (Number.isFinite(fromUser)) return fromUser

  // fallback: lees userId uit de JWT (login-response bevat vaak geen id)
  const payload = decodeJwtPayload(getToken())
  const fromToken = Number(payload?.userId ?? payload?.id)
  return Number.isFinite(fromToken) ? fromToken : null
}

export function isLoggedIn() {
  return Boolean(getToken())
}

// uitloggen: alleen localStorage legen (geen API-call volgens NOVI docs)
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
