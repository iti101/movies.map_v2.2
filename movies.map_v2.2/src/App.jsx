import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext.jsx'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MovieDetailPage from './pages/MovieDetailPage.jsx'
import TvShowDetailPage from './pages/TvShowDetailPage.jsx'
import PersonDetailPage from './pages/PersonDetailPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import WatchlistPage from './pages/WatchlistPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} /> {/* eigen watchlists bekijken en aanmaken */}
          <Route path="/movie/:movieId" element={<MovieDetailPage />} />
          <Route path="/tv/:tvId" element={<TvShowDetailPage />} />
          <Route path="/person/:personId" element={<PersonDetailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
