import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Quiz from './components/Quiz'
import Save from './components/Save'
import NotesArchive from './components/NotesArchive'
import Notes from './components/Notes'
import LiveRecord from './components/LiveRecord'
import Settings from './components/Settings'
import Profile from './components/Profile'
import PrivateRoute from './components/PrivateRoute'
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
            <Route path="/quiz" element={
              <PrivateRoute>
                <Quiz />
              </PrivateRoute>
            } />
            <Route path="/notes" element={
              <PrivateRoute>
                <NotesArchive />
              </PrivateRoute>
            } />
            <Route path="/notes/:noteId" element={
              <PrivateRoute>
                <Notes />
              </PrivateRoute>
            } />
            <Route path="/record" element={
              <PrivateRoute>
                <LiveRecord />
              </PrivateRoute>
            } />
            <Route path="/save" element={
              <PrivateRoute>
                <Save />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  )
}

export default App
