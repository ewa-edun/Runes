import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="container">
        <div className="hero">
          <h1>Your AI-powered study assistant</h1>
          <p>Capture, organize, and reinforce knowledge through AI-generated transcriptions, summaries, and quizzes.</p>
          <div className="hero-buttons">
            <Link to="/record" className="btn">Start Taking Notes Now</Link>
            <Link to="/notes" className="btn btn-outline">View Your Notes</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
