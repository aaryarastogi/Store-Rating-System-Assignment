import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, validateEmail, validatePassword, validateAddress } from '../utils/validators';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState({ name: false, email: false, password: false, address: false });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    const newErrors = {};
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const addressError = validateAddress(formData.address);
    if (addressError) newErrors.address = addressError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      navigate('/user');
    } else {
      if (result.errors) {
        setErrors(result.errors.reduce((acc, err) => {
          const field = err.param || err.path || err.field;
          acc[field] = err.msg || err.message;
          return acc;
        }, {}));
      } else {
        setMessage(result.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="auth-container register-page">
      <div className="auth-background">
        <div className="auth-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
              <path d="M24 16L28 24H32L26 32H22L16 24H20L24 16Z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#667eea"/>
                  <stop offset="1" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Create Account</h1>
          <p>Join us today and start your journey</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocused({ ...focused, name: true })}
                onBlur={() => setFocused({ ...focused, name: false })}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
                required
              />
              <label className={formData.name || focused.name ? 'active' : ''}>Full Name (20-60 characters)</label>
            </div>
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused({ ...focused, email: true })}
                onBlur={() => setFocused({ ...focused, email: false })}
                placeholder="Enter your email address"
                className={errors.email ? 'error' : ''}
                required
              />
              <label className={formData.email || focused.email ? 'active' : ''}>Email Address</label>
            </div>
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused({ ...focused, password: true })}
                onBlur={() => setFocused({ ...focused, password: false })}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                required
              />
              <label className={formData.password || focused.password ? 'active' : ''}>Password (8-16 chars, 1 uppercase, 1 special char)</label>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          <div className="form-group">
            <div className="input-wrapper textarea-wrapper">
              <svg className="input-icon textarea-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3.33333 15.8333H16.6667C17.5871 15.8333 18.3333 15.0871 18.3333 14.1667V5.83333C18.3333 4.91286 17.5871 4.16667 16.6667 4.16667H3.33333C2.41286 4.16667 1.66667 4.91286 1.66667 5.83333V14.1667C1.66667 15.0871 2.41286 15.8333 3.33333 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 8.33333H15M5 11.6667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                onFocus={() => setFocused({ ...focused, address: true })}
                onBlur={() => setFocused({ ...focused, address: false })}
                placeholder="Enter your address (optional)"
                rows="3"
                className={`textarea-input ${errors.address ? 'error' : ''}`}
              />
              <label className={`textarea-label ${formData.address || focused.address ? 'active' : ''}`}>Address (Optional, max 400 characters)</label>
            </div>
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>
          {message && <div className="error-message global-error">{message}</div>}
          <button type="submit" className="auth-button">
            <span>Create Account</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;