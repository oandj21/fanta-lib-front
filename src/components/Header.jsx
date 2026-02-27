// components/Header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import "../css/Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [typedSequence, setTypedSequence] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const searchRef = useRef(null);
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

  // Load all books for search
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('https://fanta-lib-back-production.up.railway.app/api/livres');
        const data = await response.json();
        setAllBooks(data);
      } catch (error) {
        console.error('Error fetching books for search:', error);
      }
    };
    fetchBooks();
  }, []);

  // Search function
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allBooks.filter(book => 
      (book.titre?.toLowerCase().includes(query) || 
       book.auteur?.toLowerCase().includes(query))
    ).slice(0, 5); // Limit to 5 results
    
    setSearchResults(results);
  }, [searchQuery, allBooks]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search result click
  const handleResultClick = (bookId) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(`/livres?book=${bookId}`);
  };

  // Get cart count from localStorage as backup
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

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/livres", label: "الكتب" },
    { to: "/contact", label: "اتصل بنا" },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/logo.jpeg" alt="Fantasia Logo" className="logo-image" />
          <span>فانتازيا</span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="search-container" ref={searchRef}>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="ابحث عن كتاب أو مؤلف..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="search-input"
            />
            <Search className="search-icon" size={18} />
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(book => (
                <div
                  key={book.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(book.id)}
                >
                  <img 
                    src={book.images ? `https://fanta-lib-back-production.up.railway.app/storage/${typeof book.images === 'string' ? JSON.parse(book.images)[0] : book.images[0]}` : 'https://via.placeholder.com/50x70'}
                    alt={book.titre}
                    className="result-image"
                  />
                  <div className="result-info">
                    <div className="result-title">{book.titre}</div>
                    <div className="result-author">{book.auteur}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="mobile-search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="ابحث عن كتاب أو مؤلف..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="search-input"
          />
          <Search className="search-icon" size={18} />
        </div>
        
        {/* Mobile Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="mobile-search-results">
            {searchResults.map(book => (
              <div
                key={book.id}
                className="search-result-item"
                onClick={() => handleResultClick(book.id)}
              >
                <img 
                  src={book.images ? `https://fanta-lib-back-production.up.railway.app/storage/${typeof book.images === 'string' ? JSON.parse(book.images)[0] : book.images[0]}` : 'https://via.placeholder.com/50x70'}
                  alt={book.titre}
                  className="result-image"
                />
                <div className="result-info">
                  <div className="result-title">{book.titre}</div>
                  <div className="result-author">{book.auteur}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
              دخول المدير
            </Link>
          )}
        </div>
      )}
    </header>
  );
}