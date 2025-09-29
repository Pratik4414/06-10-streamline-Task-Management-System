
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { validateRegistrationForm, validation, getPasswordStrength } from '../utils/validation';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedRole, setSelectedRole] = useState('employee');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '', color: '' });
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  const { name, email, password, confirmPassword } = formData;

  // Real-time validation on field change
  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Mark field as touched
    setFieldTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate specific field
    let errors = [];
    switch (name) {
      case 'name':
        errors = validation.name(value);
        break;
      case 'email':
        errors = validation.email(value);
        break;
      case 'password':
        errors = validation.password(value);
        setPasswordStrength(getPasswordStrength(value));
        break;
      case 'confirmPassword':
        errors = validation.confirmPassword(formData.password, value);
        break;
      default:
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: errors
    }));
  };

  // Handle field blur for validation
  const onBlur = (e) => {
    const { name } = e.target;
    setFieldTouched(prev => ({ ...prev, [name]: true }));
  };

  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFieldTouched(prev => ({ ...prev, role: true }));
    setFieldErrors(prev => ({
      ...prev,
      role: validation.role(role)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setFieldTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true
    });
    
    // Validate entire form
    const validationResult = validateRegistrationForm({
      ...formData,
      role: selectedRole
    });
    
    if (!validationResult.isValid) {
      setFieldErrors(validationResult.errors);
      setError('Please fix the errors above before submitting.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    const res = await registerUser({ name, email, password, role: selectedRole });

    if (res.success) {
      if (res.backupCodes && res.requiresBackupCodeDownload) {
        // Handle automatic backup code generation
        setBackupCodes(res.backupCodes);
        setRegistrationComplete(true);
        
        // Trigger automatic download
        const blob = new Blob([res.backupCodes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        setIsLoading(false);
      } else {
        // Legacy registration (shouldn't happen with new system)
        alert('Registration successful! Please sign in.');
        navigate('/');
      }
    } else {
      setError(res.error || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {!registrationComplete ? (
          <>
            <h2 className="register-title">Create your Account</h2>
            <p className="register-subtitle">Join our platform to manage your tasks.</p>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={name} 
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Enter Your Name" 
                  className={fieldTouched.name && fieldErrors.name?.length > 0 ? 'error' : ''}
                  required 
                />
                {fieldTouched.name && fieldErrors.name?.length > 0 && (
                  <div className="field-errors">
                    {fieldErrors.name.map((error, index) => (
                      <span key={index} className="error-text">{error}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={email} 
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="yourname@gmail.com" 
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
                  name="password" 
                  value={password} 
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Enter a strong password" 
                  className={fieldTouched.password && fieldErrors.password?.length > 0 ? 'error' : ''}
                  required 
                />
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: `${(passwordStrength.level / 4) * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }}
                      ></div>
                    </div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {fieldTouched.password && fieldErrors.password?.length > 0 && (
                  <div className="field-errors">
                    {fieldErrors.password.map((error, index) => (
                      <span key={index} className="error-text">{error}</span>
                    ))}
                  </div>
                )}
                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li className={/[A-Z]/.test(password) ? 'valid' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? 'valid' : ''}>One lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? 'valid' : ''}>One number</li>
                    <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'valid' : ''}>One special character</li>
                    <li className={password.length >= 8 ? 'valid' : ''}>At least 8 characters</li>
                  </ul>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={confirmPassword} 
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Re-enter your password" 
                  className={fieldTouched.confirmPassword && fieldErrors.confirmPassword?.length > 0 ? 'error' : ''}
                  required 
                />
                {fieldTouched.confirmPassword && fieldErrors.confirmPassword?.length > 0 && (
                  <div className="field-errors">
                    {fieldErrors.confirmPassword.map((error, index) => (
                      <span key={index} className="error-text">{error}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Select your Role</label>
                <div className="role-selector">
                  <button 
                    type="button" 
                    className={selectedRole === 'employee' ? 'active' : ''} 
                    onClick={() => handleRoleSelect('employee')}
                  >
                    Employee
                  </button>
                  <button 
                    type="button" 
                    className={selectedRole === 'manager' ? 'active' : ''} 
                    onClick={() => handleRoleSelect('manager')}
                  >
                    Manager
                  </button>
                </div>
                {fieldTouched.role && fieldErrors.role?.length > 0 && (
                  <div className="field-errors">
                    {fieldErrors.role.map((error, index) => (
                      <span key={index} className="error-text">{error}</span>
                    ))}
                  </div>
                )}
              </div>
              
              {error && <p className="error-message">{error}</p>}
              
              <button type="submit" className="register-button" disabled={isLoading}>
                {isLoading ? <div className="spinner"></div> : 'Create Account'}
              </button>
            </form>

            <p className="redirect-text">
              Already have an account?{' '}
              <Link to="/" className="redirect-link">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          // Registration complete - show backup codes
          <>
            <h2 className="register-title">🎉 Registration Complete!</h2>
            <div className="backup-codes-success">
              <div className="success-message">
                <p><strong>Important:</strong> Your backup codes have been generated and downloaded automatically.</p>
                <p>These 8 codes are required for login. Keep them safe!</p>
              </div>
              
              <div className="backup-codes-display">
                <h3>Your Backup Codes:</h3>
                <div className="codes-grid">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="code-item">{code}</div>
                  ))}
                </div>
                <p className="code-warning">
                  ⚠️ Each code can only be used once. Store them securely!
                </p>
              </div>
              
              <div className="next-steps">
                <h3>Next Steps:</h3>
                <ol>
                  <li>Save the downloaded <code>backup-codes.txt</code> file in a secure location</li>
                  <li>Consider printing a copy as backup</li>
                  <li>You'll need one of these codes every time you log in</li>
                </ol>
              </div>
              
              <button 
                className="continue-button" 
                onClick={() => navigate('/')}
              >
                Continue to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
