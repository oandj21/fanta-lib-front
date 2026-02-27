// components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import SearchDropdown from "./SearchDropdown";
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

  // Close mobile menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Use either context count or localStorage count
  const displayCount = totalCount || localCartCount;

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/logo.jpeg" alt="Fantasia Logo" className="logo-image" />
          <span>فانتازيا</span>
        </Link>

        {/* Always visible search bar - hidden on mobile */}
        <div className="header-search">
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
          <Link to="/cart" className="mobile-cart-link">
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
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {/* Mobile Navigation Links */}
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
          
          {/* Mobile Search */}
          <div className="mobile-search-wrapper">
            <SearchDropdown isMobile={true} />
          </div>
          
          {/* Secret Admin Link in mobile menu */}
          {showAdminLink && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mobile-admin-link"
            >
              دخول المدير
            </Link>
          )}
        </div>
      )}
    </header>
  );
}