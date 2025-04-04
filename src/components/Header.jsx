import { Link } from 'react-router-dom'
import './Header.css'
import runesLogo from '/runes logo transparent.png'

function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src={runesLogo} alt="Runes Logo" className="logo" />
          </Link>
          <div className="nav-buttons">
            <Link to="/settings" className="btn btn-outline">Settings</Link>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn">Sign Up</Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
