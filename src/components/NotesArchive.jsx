import { Link } from 'react-router-dom'
import './NotesArchive.css'

function NotesArchive() {
  return (
    <div className="notes-archive">
      <div className="container">
        <div className="archive-header">
          <h2>Notes Archive</h2>
          <div className="archive-controls">
            <input type="search" placeholder="Search notes..." className="search-input" />
            <select className="sort-select">
              <option value="date">Sort by Date</option>
              <option value="topic">Sort by Topic</option>
              <option value="speaker">Sort by Speaker</option>
            </select>
            <Link to="/settings" className="btn btn-outline">Settings</Link>
            <Link to="/record" className="btn">New Recording</Link>
            <Link to="/profile" className="btn">Profile</Link>

          </div>
        </div>

        <div className="notes-grid">
          {/* Example note cards */}
          <div className="note-card card">
            <div className="note-header">
              <h3>Introduction to AI</h3>
              <span className="note-date">Jan 15, 2024</span>
            </div>
            <p className="note-preview">Understanding the basics of artificial intelligence and its applications...</p>
            <div className="note-footer">
              <span className="note-topic">Topic: AI</span>
              <Link to="/quiz" className="btn">Take Quiz</Link>
            </div>
          </div>

          <div className="note-card card">
            <div className="note-header">
              <h3>Machine Learning Basics</h3>
              <span className="note-date">Jan 16, 2024</span>
            </div>
            <p className="note-preview">Exploring fundamental concepts of machine learning...</p>
            <div className="note-footer">
              <span className="note-topic">Topic: ML</span>
              <Link to="/quiz" className="btn">Take Quiz</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesArchive
