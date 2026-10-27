import { useState } from 'react'
import Modal from './Modal.jsx'
import { createProfile, login, registerUser } from '../API/novi.js'
import { buildSessionUser } from '../authSession.js'

const PASSWORD_HINT = (
  <ul className="modal-hint-list">
    <li>At least 8 characters</li>
    <li>At least 1 number</li>
    <li>At least 1 special character</li>
  </ul>
)

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

// Create-account modal: user + email/password, daarna auto-login
function SignupModal({ isOpen, onClose, onSignedUp, onSignIn, onBackHome }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setIsSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose?.()
  }

  function handleSignIn() {
    resetForm()
    onClose?.()
    onSignIn?.()
  }

  function handleBackHome() {
    resetForm()
    onClose?.()
    onBackHome?.()
  }

  async function handleSubmit() {
    setError(null)

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()

    if (!trimmedUsername) {
      setError('Please choose a username.')
      return
    }
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    if (!isStrongPassword(password)) {
      setError(
        'Password must be at least 8 characters and include a number and a special character.',
      )
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await registerUser({
        email: trimmedEmail,
        password,
      })
      const auth = await login({ email: trimmedEmail, password })
      await createProfile({
        userId: user.id,
        username: trimmedUsername,
        token: auth.token,
      })

      const session = {
        token: auth.token,
        user: buildSessionUser(auth.token, {
          ...auth.user,
          id: user.id,
          username: trimmedUsername,
        }),
      }

      resetForm()
      onSignedUp?.(session)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create account"
      subtitle="Register with your email to save watchlists and write reviews."
      submitLabel={isSubmitting ? 'Creating account…' : 'Create account'}
      submitDisabled={isSubmitting}
      onSubmit={handleSubmit}
      error={error}
      inputs={[
        {
          label: 'Username',
          type: 'text',
          placeholder: 'Choose a username',
          value: username,
          onChange: setUsername,
          autoComplete: 'username',
        },
        {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
          value: email,
          onChange: setEmail,
          autoComplete: 'email',
        },
        {
          label: 'Password',
          type: 'password',
          placeholder: 'Create a strong password',
          value: password,
          onChange: setPassword,
          revealable: true,
          autoComplete: 'new-password',
          hint: PASSWORD_HINT,
        },
        {
          label: 'Confirm password',
          type: 'password',
          placeholder: 'Repeat your password',
          value: confirmPassword,
          onChange: setConfirmPassword,
          revealable: true,
          autoComplete: 'new-password',
        },
      ]}
      footer={
        <>
          <p className="modal-footer-row">
            Already have an account?
            <button
              type="button"
              className="modal-footer-link"
              onClick={handleSignIn}
            >
              Sign in
            </button>
          </p>
          <p className="modal-footer-row">
            <button
              type="button"
              className="modal-footer-link solo"
              onClick={handleBackHome}
            >
              Back to home
            </button>
          </p>
        </>
      }
    />
  )
}

export default SignupModal
