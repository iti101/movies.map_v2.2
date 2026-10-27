import { useEffect, useId, useState } from 'react'
import Button from './Button'
import StarRating from './StarRating'
import { useAuth } from '../AuthContext.jsx'
import { getToken, getUserId } from '../authSession.js'
import { createReview, getReviewsForMedia } from '../API/novi.js'
import './ReviewSection.css'

// zet een API-datum om in een leesbare datum zoals: "October 27, 2026"
function formatReviewDate(dateText) {
  if (!dateText) return null
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// review-formulier + lijst onder de storyline op de film-detailpagina
function ReviewSection({ mediaType = 'movie', mediaId }) {
  const fieldId = useId()
  const { isLoggedIn, user, openLogin } = useAuth()

  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')

  // laadt reviews voor deze titel wanneer media of login-status verandert
  useEffect(() => {
    let ignore = false

    async function loadReviews() {
      const token = getToken()
      // zonder token of mediaId geen reviews ophalen (API vereist login)
      if (!token || mediaId == null) {
        setReviews([])
        setListError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setListError('')

      try {
        const list = await getReviewsForMedia(mediaType, mediaId, token)
        if (!ignore) setReviews(list)
      } catch (err) {
        if (!ignore) {
          setReviews([])
          setListError(err.message || 'Could not load reviews.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadReviews()

    // voorkomt state-updates als de component al is unmounted
    return () => {
      ignore = true
    }
  }, [mediaType, mediaId, isLoggedIn])

  // publiceert een review, of opent login als je niet bent ingelogd
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    // token/userId op het moment van klikken lezen (niet uit stale context)
    const token = getToken()
    const userId = getUserId() ?? user?.id

    if (!isLoggedIn || userId == null || !token) {
      openLogin()
      return
    }

    const trimmed = text.trim()
    if (!trimmed) {
      setError('Write a short review before submitting.')
      return
    }

    setSubmitting(true)

    try {
      await createReview({
        userId,
        mediaType,
        mediaId,
        text: trimmed,
        rating,
        token,
      })
      // veld legen en de lijst direct verversen
      setText('')
      setRating(0)
      setReviews(await getReviewsForMedia(mediaType, mediaId, token))
      setListError('')
    } catch (err) {
      setError(err.message || 'Could not publish your review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="review-section">
      <h2 className="detail-section-title">Leave a review</h2>

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="review-rating-field">
          <span className="review-label">Your rating</span>
          <StarRating
            value={rating}
            onChange={setRating}
            disabled={submitting}
            label="Your rating"
          />
        </div>
        <label className="review-label" htmlFor={fieldId}>
          Your review
        </label>
        <textarea
          id={fieldId}
          className="review-textarea"
          rows={4}
          maxLength={2000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What did you think?"
          disabled={submitting}
        />
        <div className="review-form-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
        {error && <p className="review-status review-status-error">{error}</p>}
      </form>

      {/* lijst met bestaande reviews onder het formulier */}
      <div className="review-list-wrap">
        {loading ? (
          <p className="review-status">Loading reviews…</p>
        ) : listError ? (
          <p className="review-status review-status-error">{listError}</p>
        ) : reviews.length === 0 ? (
          <p className="review-status">
            {isLoggedIn ? 'No reviews yet.' : 'Sign in to read and leave reviews.'}
          </p>
        ) : (
          <ul className="review-list">
            {reviews.map((review) => {
              // eigen review toont de username; anders "Member"
              const isOwn =
                user?.id != null && Number(review.userId) === Number(user.id)
              const author =
                isOwn && user.username ? user.username : 'Member'
              const when = formatReviewDate(review.createdAt)

              return (
                <li
                  key={review.id ?? `${review.userId}-${review.createdAt}`}
                  className="review-item"
                >
                  <div className="review-meta">
                    <span className="review-author">{author}</span>
                    {when && <span className="review-date">{when}</span>}
                    {Number(review.rating) > 0 && (
                      <StarRating
                        value={Number(review.rating)}
                        interactive={false}
                        label={`${Number(review.rating)} out of 5 stars`}
                      />
                    )}
                  </div>
                  {review.text && (
                    <p className="review-text">{review.text}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default ReviewSection
