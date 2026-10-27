import { useState } from 'react'
import './StarRating.css'

function clampStars(value) {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.min(5, Math.max(0, Math.round(value)))
}

// 5 sterren: hover-preview, klik om te kiezen, of alleen tonen (read-only)
function StarRating({
  value = 0,
  onChange,
  interactive = true,
  disabled = false,
  label = 'Rating',
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const selected = clampStars(value)
  const canInteract = interactive && !disabled && typeof onChange === 'function'
  const displayValue =
    canInteract && hoverValue > 0 ? hoverValue : selected

  function handleEnter(starIndex) {
    if (!canInteract) return
    setHoverValue(starIndex)
  }

  function handleLeave() {
    if (!canInteract) return
    setHoverValue(0)
  }

  function handleClick(starIndex) {
    if (!canInteract) return
    onChange(starIndex)
  }

  function handleKeyDown(event, starIndex) {
    if (!canInteract) return

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = Math.min(5, starIndex + 1)
      onChange(next)
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = Math.max(1, starIndex - 1)
      onChange(next)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      onChange(1)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      onChange(5)
    }
  }

  return (
    <div
      className={`star-rating${canInteract ? ' star-rating--interactive' : ''}`}
      role={canInteract ? 'radiogroup' : 'img'}
      aria-label={label}
      onMouseLeave={handleLeave}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = displayValue >= starIndex
        const checked = canInteract && selected === starIndex

        return (
          <button
            key={starIndex}
            type="button"
            className={`star-rating__star${filled ? ' is-filled' : ''}`}
            disabled={!canInteract}
            aria-label={`${starIndex} star${starIndex === 1 ? '' : 's'}`}
            aria-checked={canInteract ? checked : undefined}
            role={canInteract ? 'radio' : undefined}
            tabIndex={
              canInteract
                ? selected === starIndex || (selected === 0 && starIndex === 1)
                  ? 0
                  : -1
                : undefined
            }
            onMouseEnter={() => handleEnter(starIndex)}
            onFocus={() => handleEnter(starIndex)}
            onClick={() => handleClick(starIndex)}
            onKeyDown={(event) => handleKeyDown(event, starIndex)}
          >
            <span aria-hidden="true">★</span>
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
