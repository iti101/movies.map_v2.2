import './DetailPage.css'

// One card in the related list (cast, similar titles, and so on).
// If onClick is missing, the card is a dead link for now.
function RelatedCard({ item, onClick }) {
  const content = (
    <>
      {item.image ? (
        <img src={item.image} alt="" className="detail-card-image" />
      ) : (
        <div className="detail-card-image empty" />
      )}
      <p className="detail-card-title">{item.title}</p>
      {item.info && <p className="detail-card-info">{item.info}</p>}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className="detail-card" onClick={() => onClick(item.id)}>
        {content}
      </button>
    )
  }

  // Dead link until ActorDetailPage (or similar) is ready
  return (
    <a
      href="#"
      className="detail-card"
      onClick={(event) => event.preventDefault()}
    >
      {content}
    </a>
  )
}

// Shared layout for a movie, actor, or TV show page.
// The page that uses this decides what each prop means.
function DetailPage({
  image,
  title,
  tagline,
  facts,
  rating,
  actions,
  textTitle,
  text,
  relatedTitle,
  related,
  onRelatedClick,
}) {
  const items = related || []
  const factList = facts || []

  return (
    <article className="detail">
      <div className="detail-top">
        {image ? (
          <img src={image} alt="" className="detail-image" />
        ) : (
          <div className="detail-image empty" />
        )}

        <div className="detail-copy">
          <h1 className="detail-title">{title}</h1>

          {tagline && <p className="detail-tagline">{tagline}</p>}

          {/* Label + value rows: release date, directors, runtime, genres */}
          {factList.length > 0 && (
            <dl className="detail-facts">
              {factList.map((fact) => (
                <div key={fact.label} className="detail-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* User rating shown a bit larger than the other facts */}
          {rating && (
            <div className="detail-rating">
              <p className="detail-rating-label">User rating</p>
              <div>
                <p className="detail-rating-score">{rating.score} / 10</p>
                {rating.count && (
                  <p className="detail-rating-count">{rating.count} ratings</p>
                )}
              </div>
            </div>
          )}

          {actions && <div className="detail-actions">{actions}</div>}
        </div>
      </div>

      {/* Longer paragraph: storyline, biography, and so on */}
      {(textTitle || text) && (
        <section className="detail-story">
          {textTitle && <h2 className="detail-section-title">{textTitle}</h2>}
          {text && <p className="detail-text">{text}</p>}
        </section>
      )}

      <section className="detail-related">
        {relatedTitle && (
          <h2 className="detail-section-title">{relatedTitle}</h2>
        )}

        {items.length === 0 ? (
          <p className="detail-related-empty">Nothing to show here.</p>
        ) : (
          <div className="detail-related-list">
            {items.map((item) => (
              <RelatedCard
                key={item.id}
                item={item}
                onClick={onRelatedClick}
              />
            ))}
          </div>
        )}
      </section>
    </article>
  )
}

export default DetailPage
