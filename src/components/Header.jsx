// components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ShoppingCart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import "../css/Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [typedSequence, setTypedSequence] = useState("");
  const location = useLocation();
  
  // Secret code: "fantasia"
  const secretCode = "fantasia";
  
  // Safely use cart with fallback
  let cartData;
  try {
    cartData = useCart();
  } catch (e) {
    // Fallback when CartProvider is not available
    cartData = { totalCount: 0 };
  }
  
  const { totalCount } = cartData;

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/livres", label: "Livres" },
    { to: "/contact", label: "Contact" },
  ];

  // Also get cart count from localStorage as backup
  const [localCartCount, setLocalCartCount] = useState(0);
  
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setLocalCartCount(cart.length);
    };
    
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Keyboard listener for secret code
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only listen to letter keys
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        const newSequence = (typedSequence + e.key.toLowerCase()).slice(-secretCode.length);
        setTypedSequence(newSequence);
        
        // Check if the sequence matches the secret code
        if (newSequence === secretCode) {
          setShowAdminLink(true);
          // Reset sequence after showing admin link
          setTypedSequence("");
          
          // Optional: Hide admin link after 5 seconds of inactivity
          setTimeout(() => {
            setShowAdminLink(false);
          }, 5000);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [typedSequence, secretCode]);

  // Use either context count or localStorage count
  const displayCount = totalCount || localCartCount;

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <BookOpen />
          <span>Fantasia</span>
        </Link>

        <nav className="desktop-nav">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}

          <Link to="/cart" className="cart-link">
            <ShoppingCart className="cart-icon" />
            {displayCount > 0 && (
              <span className="cart-badge">{displayCount}</span>
            )}
          </Link>

          {/* Secret Admin Link - only shows when "fantasia" is typed */}
          {showAdminLink && (
            <Link to="/login" className="admin-link">
              Accès Admin
            </Link>
          )}
        </nav>

        <div className="mobile-actions">
          <Link to="/cart" className="mobile-cart-link">
            <ShoppingCart className="cart-icon" />
            {displayCount > 0 && (
              <span className="cart-badge">{displayCount}</span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="menu-button"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`mobile-nav-link ${location.pathname === to ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
          
          {/* Secret Admin Link in mobile menu */}
          {showAdminLink && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mobile-admin-link"
            >
              Accès Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}