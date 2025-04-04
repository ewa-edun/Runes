import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

function Register() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add registration logic here
    navigate('/notes');
  };

  return (
    <div className="register">
      <div className="container">
        <div className="register-card card">
          <h2>Create Account</h2>
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-control">
              <input type="text" placeholder="Full Name" required />
            </div>
            <div className="form-control">
              <input type="email" placeholder="Email" required />
            </div>
            <div className="form-control">
              <input type="password" placeholder="Password" required />
            </div>
            <div className="form-control">
              <input type="password" placeholder="Confirm Password" required />
            </div>
            <button type="submit" className="btn">Register</button>
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
