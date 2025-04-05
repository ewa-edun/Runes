import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Quiz from './components/Quiz'
import NotesArchive from './components/NotesArchive'
import LiveRecord from './components/LiveRecord'
import Settings from './components/Settings'
import Profile from './components/Profile'
import './App.css'

function App() {
  return (
    <>
      <div className="app">
        <Header />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/notes" element={<NotesArchive />} />
            <Route path="/record" element={<LiveRecord />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  )
}

export default App
