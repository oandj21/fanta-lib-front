// pages/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  login,
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
  selectAuthUser,
  clearAuthError
} from '../store/store';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import '../css/AdminLogin.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  // Debug function to log authentication status
  const logAuthStatus = (user, status) => {
    console.log(`${status} - User:`, {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      is_active: user?.is_active
    });
  };

  // Clear any previous errors on component mount
  useEffect(() => {
    dispatch(clearAuthError());
    setIsRedirecting(false);
    
    // Check localStorage for existing session
    const storedUser = localStorage.getItem("utilisateur");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      console.log('Found stored user session');
      try {
        const parsedUser = JSON.parse(storedUser);
        logAuthStatus(parsedUser, 'Stored session found');
        setIsRedirecting(true);
        // Navigate to /dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem("utilisateur");
        localStorage.removeItem("token");
      }
    }
  }, [dispatch, navigate]);

  // Handle redirection when authentication state changes
  useEffect(() => {
    console.log('Auth state changed - isAuthenticated:', isAuthenticated);
    
    if (isAuthenticated && user && !isRedirecting) {
      console.log('User authenticated successfully');
      logAuthStatus(user, 'Authenticated');
      
      const redirectTimer = setTimeout(() => {
        setIsRedirecting(true);
        // Navigate to /dashboard
        navigate('/dashboard');
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, user, navigate, isRedirecting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      console.log('Email or password is empty');
      return;
    }

    console.log('Attempting login with email:', email);
    setIsRedirecting(false);
    
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      console.log('Login API response:', result);
      
    } catch (err) {
      console.error('Login failed:', err);
      setIsRedirecting(false);
    }
  };

  // Show loading state when redirecting
  if (isRedirecting) {
    return (
      <div className="redirecting-overlay">
        <div className="redirecting-content">
          <FaSpinner className="spinner-large" />
          <h2>Connexion réussie !</h2>
          <p>Redirection vers votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-login-container">
      {/* Left Side - Background with Logo */}
      <div className="login-image-section">
        <div className="image-overlay">
          <div className="brand-content">
            <div className="brand-logo">
              <img src="/logo.jpeg" alt="Library Logo" className="brand-image" />
              <span className="brand-text">BIBLIOTHÈQUE</span>
            </div>
            <h1 className="brand-title">Gestion de Bibliothèque</h1>
            <p className="brand-subtitle">
              Système de gestion de livres, commandes et dépenses
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span>📚 Gestion des Livres</span>
              </div>
              <div className="feature-item">
                <span>🛒 Gestion des Commandes</span>
              </div>
              <div className="feature-item">
                <span>💰 Gestion des Dépenses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-header">
            <h2 className="login-title">Bienvenue</h2>
            <p className="login-subtitle">Connectez-vous à votre compte</p>
          </div>

          {error && (
            <div className="error-message-modern">
              <span className="error-icon">⚠️</span>
              {typeof error === 'string' ? error : error.message || 'Erreur de connexion'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group-modern">
              <label htmlFor="email" className="form-label">Adresse email</label>
              <div className="input-container">
                <FaUser className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="form-input-modern"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <div className="input-container">
                <FaLock className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="form-input-modern"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options-modern">
              <label className="remember-me-modern">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Se souvenir de moi
              </label>
              <a href="#" className="forgot-password-modern" onClick={(e) => e.preventDefault()}>
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button-modern"
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2025 Bibliothèque. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;