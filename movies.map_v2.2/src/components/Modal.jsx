import { useEffect, useId, useState } from 'react'
import Button from './Button.jsx'
import visibilityIcon from '../assets/visibility_opsz24.svg'
import visibilityOffIcon from '../assets/visibility_off_opsz24.svg'
import './Modal.css'

// herbruikbare modal: titel, optionele inputvelden, custom body, submit/cancel
function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle = null,
  inputs = [],
  children = null,
  submitLabel = 'Submit',
  onSubmit,
  cancelLabel = null,
  onCancel = null,
  footer = null,
  error = null,
  submitDisabled = false,
}) {
  const titleId = useId()
  const subtitleId = useId()
  // welke revealable velden tijdelijk als tekst zichtbaar zijn
  const [revealed, setRevealed] = useState({})

  // Escape sluit de modal; body-scroll wordt geblokkeerd terwijl die open is
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // reset zichtbaarheid van wachtwoorden wanneer de modal sluit
  useEffect(() => {
    if (!isOpen) setRevealed({})
  }, [isOpen])

  if (!isOpen) return null

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.()
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose?.()
  }

  function handleCancel() {
    if (onCancel) onCancel()
    else onClose?.()
  }

  function toggleReveal(index) {
    setRevealed((current) => ({
      ...current,
      [index]: !current[index],
    }))
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
      >
        <div className="modal-header">
          <div className="modal-heading">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="modal-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {inputs.map((input, index) => {
            const fieldId = `${titleId}-field-${index}`
            const isRevealed = Boolean(revealed[index])
            const inputType = input.revealable
              ? isRevealed
                ? 'text'
                : 'password'
              : input.type || 'text'

            return (
              <label key={fieldId} className="modal-field" htmlFor={fieldId}>
                {input.label && (
                  <span className="modal-label">{input.label}</span>
                )}
                <span
                  className={
                    input.revealable
                      ? 'modal-input-wrap has-toggle'
                      : 'modal-input-wrap'
                  }
                >
                  <input
                    id={fieldId}
                    className="modal-input"
                    type={inputType}
                    placeholder={input.placeholder}
                    value={input.value ?? ''}
                    autoComplete={input.autoComplete}
                    onChange={(event) => input.onChange?.(event.target.value)}
                  />
                  {input.revealable && (
                    <button
                      type="button"
                      className="modal-reveal"
                      onClick={() => toggleReveal(index)}
                      aria-label={isRevealed ? 'Hide password' : 'Show password'}
                    >
                      <img
                        src={isRevealed ? visibilityIcon : visibilityOffIcon}
                        alt=""
                        className="modal-reveal-icon"
                      />
                    </button>
                  )}
                </span>
                {input.hint && (
                  <div className="modal-hint">{input.hint}</div>
                )}
              </label>
            )
          })}

          {children}

          {error && <p className="modal-error">{error}</p>}

          <div className={cancelLabel ? 'modal-actions' : 'modal-actions single'}>
            <Button
              type="submit"
              size="medium"
              shape="pill"
              disabled={submitDisabled}
            >
              {submitLabel}
            </Button>
            {cancelLabel && (
              <button
                type="button"
                className="modal-cancel"
                onClick={handleCancel}
                disabled={submitDisabled}
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </form>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
