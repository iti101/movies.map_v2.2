// Minimum similarity (0–1) required to show a "Did you mean" suggestion
const MIN_SIMILARITY = 0.75

// Minimum typed length before we bother looking for a near-miss
const MIN_QUERY_LENGTH = 3

// Levenshtein edit-afstand tussen twee strings
function levenshtein(a, b) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

// gelijkheidsratio van 0 (onverwante) tot 1 (identiek), ongevoelig voor hoofdletters/kleine letters
export function similarity(a, b) {
  const left = (a || '').trim().toLowerCase()
  const right = (b || '').trim().toLowerCase()
  if (!left && !right) return 1
  if (!left || !right) return 0
  if (left === right) return 1

  const distance = levenshtein(left, right)
  const maxLen = Math.max(left.length, right.length)
  return 1 - distance / maxLen
}

// beste gelijkheidsratio van de query tegen een volledige titel (en/of afzonderlijke woorden)
function scoreAgainstTitle(query, title) {
  let best = similarity(query, title)
  for (const word of title.split(/\s+/)) {
    if (word.length < MIN_QUERY_LENGTH) continue
    const score = similarity(query, word)
    if (score > best) best = score
  }
  return best
}

// retourneert de beste near-miss titel vanuit een lokale lijst, of null
export function suggestQuery(query, titles) {
  const text = (query || '').trim()
  if (text.length < MIN_QUERY_LENGTH || !titles || titles.length === 0) {
    return null
  }

  const lower = text.toLowerCase()
  let bestTitle = null
  let bestScore = 0

  for (const title of titles) {
    if (!title) continue
    if (title.toLowerCase() === lower) return null

    const score = scoreAgainstTitle(text, title)
    if (score > bestScore) {
      bestScore = score
      bestTitle = title
    }
  }

  if (bestScore >= MIN_SIMILARITY && bestTitle) {
    return bestTitle
  }

  return null
}

// zet een Datamuse spelling woord om naar titel-case voor weergave / zoekopdracht
function titleCaseWord(word) {
  return word
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

// spelling-controle fallback via Datamuse wanneer de lokale titel-lijst geen 'near-miss' heeft
async function suggestFromSpelling(query) {
  const text = query.trim()
  if (text.length < MIN_QUERY_LENGTH) return null

  let response
  try {
    response = await fetch(
      'https://api.datamuse.com/words?sp=' + encodeURIComponent(text) + '&max=5'
    )
  } catch {
    return null
  }

  if (!response.ok) return null

  let words
  try {
    words = await response.json()
  } catch {
    return null
  }

  const lower = text.toLowerCase()
  for (const entry of words) {
    const word = entry && entry.word
    if (!word || word.toLowerCase() === lower) continue
    return titleCaseWord(word)
  }

  return null
}

// Local fuzzy match first; if none, try a spelling correction (async)
export async function findSuggestion(query, titles) {
  const local = suggestQuery(query, titles)
  if (local) return local
  return suggestFromSpelling(query)
}
