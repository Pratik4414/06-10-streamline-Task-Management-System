import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { validation } from '../utils/validation';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setFieldTouched(prev => ({ ...prev, email: true }));
    
    const errors = validation.email(value);
    setFieldErrors(prev => ({ ...prev, email: errors }));
  };

  // Handle field blur
  const onBlur = () => {
    setFieldTouched(prev => ({ ...prev, email: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark field as touched
    setFieldTouched({ email: true });
    
    // Validate email
    const emailErrors = validation.email(email);
    if (emailErrors.length > 0) {
      setFieldErrors({ email: emailErrors });
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await forgotPassword(email);

      if (res.success) {
        setMessage('Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.');
        setIsSubmitted(true);
        setEmail('');
        setFieldTouched({});
        setFieldErrors({});
      } else {
        setError(res.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setMessage('');
    setError('');
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="success-content">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
                <path d="M8 12l2 2 4-4" stroke="#10b981" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h2 className="success-title">Check Your Email</h2>
            <p className="success-message">{message}</p>
            <div className="success-actions">
              <button onClick={handleBackToLogin} className="back-to-login-btn">
                Back to Login
              </button>
              <button onClick={handleTryAgain} className="try-again-btn">
                Send Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">Reset Your Password</h2>
        <p className="forgot-password-subtitle">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={onBlur}
              placeholder="yourname@gmail.com or yourname@outlook.com"
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

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="reset-button" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/" className="back-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;