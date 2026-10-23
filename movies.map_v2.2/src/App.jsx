import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './pages/Landing.jsx'
import MovieDetailPage from './pages/MovieDetailPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/movie/:movieId" element={<MovieDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
