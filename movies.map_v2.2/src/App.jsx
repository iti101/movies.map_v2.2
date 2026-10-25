import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MovieDetailPage from './pages/MovieDetailPage.jsx'
import TvShowDetailPage from './pages/TvShowDetailPage.jsx'
import PersonDetailPage from './pages/PersonDetailPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/movie/:movieId" element={<MovieDetailPage />} />
        <Route path="/tv/:tvId" element={<TvShowDetailPage />} />
        <Route path="/person/:personId" element={<PersonDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
