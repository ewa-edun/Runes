import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
    navigate('/notes');
  };

  return (
    <div className="login">
      <div className="container">
        <div className="login-card card">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-control">
              <input type="email" placeholder="Email" required />
            </div>
            <div className="form-control">
              <input type="password" placeholder="Password" required />
            </div>
            <button type="submit" className="btn">Login</button>
          </form>
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
