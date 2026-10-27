import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ResultCard from '../components/ResultCard'
import { useAuth } from '../AuthContext.jsx'
import {
  addWatchlistItem,
  createWatchlist,
  getMyWatchlists,
  getWatchlistItems,
  groupItemsByWatchlist,
} from '../API/novi.js'
import { getToken, getUserId } from '../authSession.js'
import './WatchlistPage.css'

// pagina waarop de gebruiker watchlists ziet, aanmaakt en een titel kan toevoegen
function WatchlistPage() {
  const { isLoggedIn, openLogin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // titel die vanaf een film/serie-pagina is meegestuurd om toe te voegen
  const pendingItem = location.state?.pendingItem || null

  const [lists, setLists] = useState([])
  const [itemsByList, setItemsByList] = useState({})
  const [newListName, setNewListName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [addingToId, setAddingToId] = useState(null)

  // zet scroll-snap uit zodat deze pagina normaal kan scrollen
  useEffect(() => {
    document.documentElement.classList.add('no-snap')
    return () => {
      document.documentElement.classList.remove('no-snap')
    }
  }, [])

  // haalt de watchlists en hun titels van de ingelogde gebruiker op
  const loadWatchlists = useCallback(async () => {
    const token = getToken()
    const userId = getUserId()
    if (!token || !userId) return

    setLoading(true)
    setError(null)

    try {
      const watchlists = await getMyWatchlists(token, userId)
      const hasNested = watchlists.some(
        (list) =>
          Array.isArray(list?.items) ||
          Array.isArray(list?.watchlistItems) ||
          Array.isArray(list?.watchlist_items),
      )

      let flatItems = []
      if (!hasNested) {
        try {
          // filter op eigen userId (GET /watchlistItems geeft alle items terug)
          flatItems = (await getWatchlistItems(token)).filter(
            (item) =>
              item.userId == null || Number(item.userId) === Number(userId),
          )
        } catch {
          // als alle items ophalen faalt, probeer per watchlist
          const perList = await Promise.all(
            watchlists.map(async (list) => {
              try {
                const items = await getWatchlistItems(token, list.id)
                return items.map((item) => ({
                  ...item,
                  watchlistId: item.watchlistId ?? item.watchlist_id ?? list.id,
                }))
              } catch {
                return []
              }
            }),
          )
          flatItems = perList.flat()
        }
      }

      setLists(watchlists)
      setItemsByList(groupItemsByWatchlist(watchlists, flatItems))
    } catch (err) {
      setLists([])
      setItemsByList({})
      setError(err.message || 'Could not load watchlists.')
    } finally {
      setLoading(false)
    }
  }, [])

  // laad lijsten na inloggen; wis ze bij uitloggen
  useEffect(() => {
    if (!isLoggedIn) {
      setLists([])
      setItemsByList({})
      setError(null)
      return
    }
    loadWatchlists()
  }, [isLoggedIn, loadWatchlists])

  // haalt de 'toe te voegen titel' weer weg uit de pagina-state
  function clearPending() {
    navigate('.', { replace: true, state: {} })
  }

  // maakt alleen een nieuwe (lege) watchlist aan
  async function handleCreate(event) {
    event.preventDefault()

    const name = newListName.trim()
    if (!name) {
      setError('Please enter a name for the new watchlist.')
      return
    }

    const token = getToken()
    const userId = getUserId()
    if (!token || !userId) {
      openLogin()
      return
    }

    setCreating(true)
    setError(null)

    try {
      await createWatchlist({ userId, name, token })
      setNewListName('')
      await loadWatchlists()
    } catch (err) {
      if (!getToken()) {
        openLogin()
        setError('Your session expired. Please sign in again.')
      } else {
        setError(err.message || 'Could not create watchlist.')
      }
    } finally {
      setCreating(false)
    }
  }

  // voegt de pending titel toe aan de gekozen watchlist
  async function handleAddToList(watchlistId) {
    if (!pendingItem) return

    const token = getToken()
    const userId = getUserId()
    if (!token || !userId) {
      openLogin()
      return
    }

    setAddingToId(watchlistId)
    setError(null)

    try {
      await addWatchlistItem({
        watchlistId,
        userId,
        mediaType: pendingItem.mediaType,
        mediaId: pendingItem.mediaId,
        title: pendingItem.title,
        posterPath: pendingItem.posterPath,
        token,
      })
      clearPending()
      await loadWatchlists()
    } catch (err) {
      setError(err.message || 'Could not add title to watchlist.')
    } finally {
      setAddingToId(null)
    }
  }

  return (
    <main className="watchlist-page">
      <h1 className="watchlist-page-title">My Watchlists</h1>

      {pendingItem && (
        <div className="watchlist-pending">
          <p className="watchlist-pending-text">
            Add <strong>{pendingItem.title}</strong> to a watchlist
          </p>
          <Button size="small" onClick={clearPending}>
            Cancel
          </Button>
        </div>
      )}

      <form className="watchlist-create" onSubmit={handleCreate}>
        <input
          type="text"
          className="watchlist-create-input"
          placeholder="New watchlist name"
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          disabled={creating || loading}
        />
        <Button type="submit" disabled={creating || loading}>
          {creating ? 'Creating…' : 'Create list'}
        </Button>
      </form>

      {error && <p className="watchlist-page-message">{error}</p>}
      {!error && loading && (
        <p className="watchlist-page-message">Loading…</p>
      )}
      {!error && !loading && lists.length === 0 && (
        <p className="watchlist-page-message">
          You have no watchlists yet. Create one above.
        </p>
      )}

      {!loading &&
        lists.map((list) => {
          const items = itemsByList[list.id] || []
          return (
            <section key={list.id} className="watchlist-section">
              <div className="watchlist-section-header">
                <h2 className="watchlist-section-title">{list.name}</h2>
                {pendingItem && (
                  <Button
                    size="small"
                    disabled={addingToId === list.id}
                    onClick={() => handleAddToList(list.id)}
                  >
                    {addingToId === list.id ? 'Adding…' : 'Add to this list'}
                  </Button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="watchlist-empty">No titles yet.</p>
              ) : (
                <div className="watchlist-grid">
                  {items.map((item) => {
                    const key =
                      (item.media_type || 'movie') +
                      '-' +
                      item.id +
                      '-' +
                      (item.itemId ?? '')
                    return <ResultCard key={key} item={item} />
                  })}
                </div>
              )}
            </section>
          )
        })}
    </main>
  )
}

export default WatchlistPage
