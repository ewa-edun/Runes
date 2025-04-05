import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import './Header.css';
import runesLogo from '/runes logo transparent.png';

function Header() {
  const user = auth.currentUser;

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src={runesLogo} alt="Runes Logo" className="logo" />
          </Link>
          <div className="nav-buttons">
            {user ? (
              <>
                <Link to="/settings" className="btn btn-outline">Settings</Link>
                <Link to="/profile" className="btn btn-outline profile-btn">
                  <svg viewBox="0 0 24 24" className="profile-icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
