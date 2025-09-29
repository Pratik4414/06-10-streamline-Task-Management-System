import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { regenerateBackupCodes } from '../services/api';
import './AccountRecoveryPage.css';

const AccountRecoveryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password confirmation form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);

  // Handle password confirmation for backup code generation
  const handlePasswordConfirmation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verify password and generate new backup codes
      const response = await regenerateBackupCodes(email, password);

      if (response.success) {
        const codes = response.backupCodes;
        setNewBackupCodes(codes);
        
        // Auto-download backup codes
        downloadBackupCodes(codes);
        
        setSuccess('New backup codes generated successfully! You will be redirected to login page in 5 seconds.');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Please login with your credentials and one of the new backup codes.',
              type: 'success'
            }
          });
        }, 5000);
      } else {
        setError(response.error || 'Failed to generate new backup codes. Please try again.');
      }
    } catch (error) {
      console.error('Password confirmation error:', error);
      setError('Failed to generate new backup codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes as text file
  const downloadBackupCodes = (codes) => {
    const content = `Backup Codes for Account Recovery
Generated: ${new Date().toLocaleString()}
Email: ${email}

IMPORTANT: Save these codes in a secure location. Each code can only be used once.

${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Instructions:
- Use these codes when you can't access your primary authentication method
- Enter any unused code when prompted during login
- Generate new codes before these run out
- Keep these codes secure and private`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-codes-${email.split('@')[0]}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="recovery-page">
      <div className="recovery-container">
        <div className="recovery-form">
          <div className="recovery-header">
            <h1>Account Recovery</h1>
            <p>Can't access your account? We'll help you regain access.</p>
          </div>

          <form onSubmit={handlePasswordConfirmation}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Recovery</label>
              <select id="reason" value="All backup codes used" disabled>
                <option value="All backup codes used">All backup codes used</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Account Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button 
              type="submit" 
              className="recovery-button"
              disabled={loading}
            >
              {loading ? 'Generating Backup Codes...' : 'Generate New Backup Codes'}
            </button>
          </form>

          <div className="recovery-info">
            <h3>How this works:</h3>
            <ul>
              <li>✅ Enter your email and account password</li>
              <li>🔐 We'll verify your password securely</li>
              <li>📱 Fresh backup codes will be generated automatically</li>
              <li>💾 New codes will download as a text file</li>
              <li>🔄 You'll be redirected to login with new codes</li>
            </ul>
          </div>

          <div className="recovery-footer">
            <p>
              Remember your login details? 
              <button 
                type="button" 
                className="link-button"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountRecoveryPage;