import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser as apiLoginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateLoginForm, validation } from '../utils/validation';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setFieldTouched(prev => ({ ...prev, email: true }));
    const errors = validation.email(value);
    setFieldErrors(prev => ({ ...prev, email: errors }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setFieldTouched(prev => ({ ...prev, password: true }));
    const errors = value ? [] : ['Password is required'];
    setFieldErrors(prev => ({ ...prev, password: errors }));
  };

  const onBlur = (fieldName) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldTouched({ email: true, password: true });
    const validationResult = validateLoginForm({ email, password });
    
    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors);
      setError('Please fix the errors above before submitting.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiLoginUser(email, password);
      if (res.success) {
        login(res.user, res.token);
        navigate('/dashboard');
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to continue to your dashboard.</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => onBlur('email')}
              placeholder="Enter registered email address"
              className={fieldTouched.email && fieldErrors.email?.length > 0 ? 'error' : ''}
              required
            />
            {fieldTouched.email && fieldErrors.email?.length > 0 && (
              <div className="field-errors">
                {fieldErrors.email.map((error, index) => (
                  <span key={index} className="error-text">{error}</span>
                ))}
              </div>
            )}
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => onBlur('password')}
              placeholder=""
              className={fieldTouched.password && fieldErrors.password?.length > 0 ? 'error' : ''}
              required
            />
            {fieldTouched.password && fieldErrors.password?.length > 0 && (
              <div className="field-errors">
                {fieldErrors.password.map((error, index) => (
                  <span key={index} className="error-text">{error}</span>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-options">
            <button type="button" className="forgot-password-btn" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Sign In'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
