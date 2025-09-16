// Validation utility functions

// Comprehensive list of popular email domains
const ALLOWED_EMAIL_DOMAINS = [
  // Google
  'gmail.com', 'googlemail.com',
  
  // Microsoft
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  
  // Apple
  'icloud.com', 'me.com', 'mac.com',
  
  // Yahoo
  'yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.de', 'yahoo.fr', 'yahoo.it', 'yahoo.es', 'yahoo.com.au', 'yahoo.co.in', 'yahoo.co.jp',
  
  // Educational domains
  'edu', 'edu.in', 'edu.au', 'edu.uk', 'ac.uk', 'edu.ca', 'edu.sg', 'edu.my',
  
  // Corporate email providers
  'protonmail.com', 'proton.me', 'tutanota.com', 'fastmail.com', 'zoho.com',
  
  // Regional popular providers
  'aol.com', 'mail.com', 'gmx.com', 'gmx.de', 'web.de', 'yandex.com', 'yandex.ru',
  'mail.ru', 'rambler.ru', 'qq.com', '163.com', '126.com', 'sina.com',
  
  // Business/Enterprise
  'att.net', 'verizon.net', 'comcast.net', 'charter.net',
  
  // Other popular international domains
  'rediffmail.com', 'sify.com', 'indiatimes.com'
];

export const validation = {
  // Email validation - must use popular domains only
  email: (email) => {
    const errors = [];
    
    if (!email) {
      errors.push('Email is required');
      return errors;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email format');
      return errors;
    }
    
    // Extract domain from email
    const domain = email.toLowerCase().split('@')[1];
    
    if (!domain) {
      errors.push('Please enter a valid email address');
      return errors;
    }
    
    // Check if domain is in allowed list or if it's an educational domain
    const isAllowedDomain = ALLOWED_EMAIL_DOMAINS.some(allowedDomain => {
      if (allowedDomain === 'edu') {
        // Allow any .edu domain
        return domain.endsWith('.edu');
      }
      return domain === allowedDomain;
    });
    
    if (!isAllowedDomain) {
      errors.push('Please use an email from a recognized provider (Gmail, Outlook, Yahoo, educational institutions, etc.)');
    }
    
    // Additional validation for proper email structure
    const emailStructureRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailStructureRegex.test(email)) {
      errors.push('Email format is invalid');
    }
    
    return errors;
  },

  // Password validation with strength requirements
  password: (password) => {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return errors;
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  },

  // Name validation
  name: (name) => {
    const errors = [];
    
    if (!name) {
      errors.push('Name is required');
      return errors;
    }
    
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (name.trim().length > 50) {
      errors.push('Name must be less than 50 characters');
    }
    
    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
    
    // Check that name doesn't start or end with space
    if (name !== name.trim()) {
      errors.push('Name cannot start or end with spaces');
    }
    
    return errors;
  },

  // Confirm password validation
  confirmPassword: (password, confirmPassword) => {
    const errors = [];
    
    if (!confirmPassword) {
      errors.push('Please confirm your password');
      return errors;
    }
    
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return errors;
  },

  // Role validation
  role: (role) => {
    const errors = [];
    const validRoles = ['employee', 'manager'];
    
    if (!role) {
      errors.push('Please select a role');
      return errors;
    }
    
    if (!validRoles.includes(role)) {
      errors.push('Please select a valid role');
    }
    
    return errors;
  }
};

// Get password strength level
export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, text: '', color: '' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  if (score <= 2) return { level: 1, text: 'Weak', color: '#ef4444' };
  if (score <= 3) return { level: 2, text: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { level: 3, text: 'Good', color: '#3b82f6' };
  return { level: 4, text: 'Strong', color: '#10b981' };
};

// Validate entire form for registration
export const validateRegistrationForm = (formData) => {
  const { name, email, password, confirmPassword, role } = formData;
  
  const errors = {
    name: validation.name(name),
    email: validation.email(email),
    password: validation.password(password),
    confirmPassword: validation.confirmPassword(password, confirmPassword),
    role: validation.role(role)
  };
  
  // Remove empty error arrays
  Object.keys(errors).forEach(key => {
    if (errors[key].length === 0) {
      delete errors[key];
    }
  });
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate entire form for login
export const validateLoginForm = (formData) => {
  const { email, password } = formData;
  
  const errors = {
    email: validation.email(email),
    password: password ? [] : ['Password is required']
  };
  
  // Remove empty error arrays
  Object.keys(errors).forEach(key => {
    if (errors[key].length === 0) {
      delete errors[key];
    }
  });
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};