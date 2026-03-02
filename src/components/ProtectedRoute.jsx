// components/Header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import SearchDropdown from "./SearchDropdown";
import "../css/Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [typedSequence, setTypedSequence] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  
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
    { to: "/", label: "الرئيسية" },
    { to: "/livres", label: "الكتب" },
    { to: "/contact", label: "اتصل بنا" },
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
          
          // Hide admin link after 5 seconds
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

  // Close mobile menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Use either context count or localStorage count
  const displayCount = totalCount || localCartCount;

  const handleNavigation = (to) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <img src="/logo.jpeg" alt="Fantasia Logo" className="logo-image" />
          <span>فانتازيا</span>
        </Link>

        {/* Desktop search - always visible on desktop */}
        <div className="header-search desktop-only">
          <SearchDropdown />
        </div>

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
              دخول المدير
            </Link>
          )}
        </nav>

        <div className="mobile-actions">
          <Link to="/cart" className="mobile-cart-link" onClick={() => setMenuOpen(false)}>
            <ShoppingCart className="cart-icon" />
            {displayCount > 0 && (
              <span className="cart-badge">{displayCount}</span>
            )}
          </Link>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="menu-button"
            aria-label="القائمة"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Always visible mobile search bar */}
      <div className="mobile-search-bar">
        <SearchDropdown isMobile={true} />
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {/* Mobile Navigation Links */}
          {navLinks.map(({ to, label }) => (
            <button
              key={to}
              onClick={() => handleNavigation(to)}
              className={`mobile-nav-link ${location.pathname === to ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
          
          {/* Cart link in mobile menu */}
          <button
            onClick={() => handleNavigation("/cart")}
            className="mobile-nav-link"
          >
            السلة {displayCount > 0 ? `(${displayCount})` : ''}
          </button>
          
          {/* Secret Admin Link in mobile menu */}
          {showAdminLink && (
            <button
              onClick={() => handleNavigation("/login")}
              className="mobile-admin-link"
            >
              دخول المدير
            </button>
          )}
        </div>
      )}
      
      {/* Add keyframe animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}