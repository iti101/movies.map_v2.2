import './Button.css'

// herbruikbare button component; met aanpasbare kleur, formaat, type, vorm en functie (klikbaar of niet)
function Button({
  children,
  size = 'medium',
  shape = 'pill',
  disabled = false,
  type = 'button',
  onClick,
}) {
  
  // combineert de basis class met de gekozen size en shape
  const className = `button ${size} ${shape}`

  return (
    <button
      className={className}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
