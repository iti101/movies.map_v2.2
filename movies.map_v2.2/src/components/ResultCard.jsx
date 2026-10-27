import { Link } from 'react-router-dom'
import { getResultDisplay } from '../resultDisplay'
import './ResultCard.css'

// poster-kaart die naar de bijbehorende detailpagina linkt
function ResultCard({ item }) {
  const display = getResultDisplay(item)

  return (
    <Link to={display.to} className="movie">
      {display.image ? (
        <img src={display.image} alt="" className="movie-poster" />
      ) : (
        <div className="movie-poster empty" />
      )}
      <p className="movie-title">{display.title}</p>
      {display.info && <p className="movie-year">{display.info}</p>}
    </Link>
  )
}

export default ResultCard
