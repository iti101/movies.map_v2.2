import { useState } from 'react'
import Modal from './Modal.jsx'
import { login } from '../API/novi.js'
import { buildSessionUser } from '../authSession.js'

// Sign-in modal: e-mail + wachtwoord via de NOVI Dynamic API
function LoginModal({ isOpen, onClose, onLoggedIn, onCreateAccount }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setEmail('')
    setPassword('')
    setError(null)
    setIsSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose?.()
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)

    try {
      const data = await login({ email: email.trim(), password })
      const session = {
        token: data.token,
        user: buildSessionUser(data.token, data.user),
      }
      resetForm()
      onLoggedIn?.(session)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  function handleCreateAccount() {
    resetForm()
    onClose?.()
    onCreateAccount?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Sign in"
      submitLabel={isSubmitting ? 'Signing in…' : 'Sign in'}
      submitDisabled={isSubmitting}
      onSubmit={handleSubmit}
      error={error}
      inputs={[
        {
          label: 'Email',
          type: 'email',
          placeholder: '',
          value: email,
          onChange: setEmail,
          autoComplete: 'email',
        },
        {
          label: 'Password',
          type: 'password',
          placeholder: '',
          value: password,
          onChange: setPassword,
          revealable: true,
          autoComplete: 'current-password',
        },
      ]}
      footer={
        <>
          Don&apos;t have an account?
          <button
            type="button"
            className="modal-footer-link"
            onClick={handleCreateAccount}
          >
            Create an account
          </button>
        </>
      }
    />
  )
}

export default LoginModal
