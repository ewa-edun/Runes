import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import './Home.css';

function Home() {
  const user = auth.currentUser;

  return (
    <div className="home">
      <div className="container">
        <div className="hero">
          <h1>Capture thoughts. Summon runes. Learn smarter.</h1>
          <p>Capture, organize, and reinforce knowledge through AI-generated transcriptions, summaries, and quizzes.</p>
          <div className="hero-buttons">
            {user ? (
              <>
                <Link to="/record" className="btn">Start Taking Notes Now</Link>
                <Link to="/notes" className="btn btn-outline">View Your Notes</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn">Login to Start Taking Notes</Link>
                <Link to="/register" className="btn btn-outline">Create Account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
