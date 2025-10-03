import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: email+code, 2: password reset
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Verify email and backup code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!email || !backupCode) {
      setError('Email and backup code are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-backup-code-for-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, backupCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStep(2);
        setMessage('Backup code verified! Please enter your new password.');
      } else {
        setError(data.error || 'Invalid email or backup code. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password-with-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          backupCode, 
          newPassword 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        {currentStep === 1 ? (
          <>
            <h2 className="forgot-password-title">Reset Your Password</h2>
            <p className="forgot-password-subtitle">
              Enter your email and one of your backup codes to reset your password.
            </p>

            <form onSubmit={handleVerifyCode} className="forgot-password-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="backup-code">Backup Code</label>
                <input
                  type="text"
                  id="backup-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter one of your backup codes"
                  required
                />
                <small className="form-hint">
                  Use any of your backup codes that you downloaded during registration.
                </small>
              </div>
              
              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}
              
              <button type="submit" className="verify-button" disabled={isLoading}>
                {isLoading ? <div className="spinner"></div> : 'Verify & Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="forgot-password-title">Set New Password</h2>
            <p className="forgot-password-subtitle">
              Enter your new password below.
            </p>

            <form onSubmit={handlePasswordReset} className="forgot-password-form">
              <div className="input-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}
              
              <button type="submit" className="reset-button" disabled={isLoading}>
                {isLoading ? <div className="spinner"></div> : 'Reset Password'}
              </button>
              
              <button 
                type="button" 
                className="back-button" 
                onClick={() => setCurrentStep(1)}
              >
                ← Back
              </button>
            </form>
          </>
        )}

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