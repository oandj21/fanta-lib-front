// SearchDropdown.jsx
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { selectLivres } from "../store/store";
import useLanguageDirection from "../utils/useLanguageDirection";
import "../css/SearchDropdown.css";

export default function SearchDropdown({ isMobile = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const books = useSelector(selectLivres);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const { getTextDirection } = useLanguageDirection();

  // Normalize Arabic text function for better search
  const normalizeArabicText = (text) => {
    if (!text) return '';
    
    // Convert to string if not already
    text = String(text);
    
    // Normalize Arabic characters
    return text
      // Normalize Alif variations to ا
      .replace(/[أإآ]/g, 'ا')
      // Normalize Teh Marbuta (ة) to Heh (ه)
      .replace(/ة/g, 'ه')
      // Normalize Alef Maksura (ى) to Yeh (ي)
      .replace(/ى/g, 'ي')
      // Remove diacritics (Tashkeel)
      .replace(/[ًٌٍَُِّْ]|[\u064B-\u065F]/g, '')
      // Convert to lowercase for case-insensitive comparison
      .toLowerCase();
  };

  // Filter books based on search term with Arabic normalization
  const filteredBooks = books.filter((book) => {
    if (searchTerm.trim().length < 2) return false;
    
    const title = normalizeArabicText(book.titre || "");
    const author = normalizeArabicText(book.auteur || "");
    const category = normalizeArabicText(book.categorie || "");
    const term = normalizeArabicText(searchTerm);

    return (
      title.includes(term) ||
      author.includes(term) ||
      category.includes(term)
    );
  }).slice(0, 10); // Limit to 10 results

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show results when search term changes
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchTerm]);

  // FIXED: Handle book click with proper navigation and state management
  const handleBookClick = (book) => {
    // Navigate to livres page with book ID in URL
    navigate(`/livres?book=${book.id}`);
    
    // Clear search term and hide results after navigation
    // The setTimeout ensures navigation completes before clearing
    setTimeout(() => {
      setSearchTerm("");
      setShowResults(false);
    }, 100);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      // Navigate to livres page with search query
      navigate(`/livres?search=${encodeURIComponent(searchTerm)}`);
      
      // Clear search term and hide results after navigation
      setTimeout(() => {
        setSearchTerm("");
        setShowResults(false);
      }, 100);
    }
  };

  // Handle clear button click
  const handleClearSearch = () => {
    setSearchTerm("");
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/40x60?text=No+Cover';
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        // If parsing fails, treat as direct filename
        return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images}`;
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images[0]}`;
    }
    
    return 'https://via.placeholder.com/40x60?text=No+Cover';
  };

  // Handle image error
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://via.placeholder.com/40x60?text=Error";
  };

  return (
    <div className={`search-dropdown ${isMobile ? 'mobile-search' : ''}`} ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <Search size={18} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="ابحث عن كتاب أو مؤلف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          dir={getTextDirection(searchTerm) || 'rtl'}
          style={{ 
            textAlign: (getTextDirection(searchTerm) || 'rtl') === 'rtl' ? 'right' : 'left' 
          }}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="clear-search"
            aria-label="مسح البحث"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {showResults && searchTerm.trim().length >= 2 && (
        <div className="search-results">
          {filteredBooks.length > 0 ? (
            <>
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="search-result-item"
                  onClick={() => handleBookClick(book)}
                >
                  <div className="result-image">
                    <img
                      src={getImageUrl(book.images)}
                      alt={book.titre || "غلاف الكتاب"}
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>
                  <div className="result-info">
                    <h4 
                      className="result-title"
                      dir={getTextDirection(book.titre)}
                      style={{ textAlign: getTextDirection(book.titre) === 'rtl' ? 'right' : 'left' }}
                    >
                      {book.titre || "عنوان غير معروف"}
                    </h4>
                    <p 
                      className="result-author"
                      dir={getTextDirection(book.auteur)}
                      style={{ textAlign: getTextDirection(book.auteur) === 'rtl' ? 'right' : 'left' }}
                    >
                      {book.auteur || "مؤلف غير معروف"}
                    </p>
                    {book.categorie && (
                      <span className="result-category">
                        {book.categorie}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div 
                className="search-footer" 
                onClick={handleSearchSubmit}
              >
                <Search size={14} />
                <span>عرض جميع النتائج لـ "{searchTerm}"</span>
              </div>
            </>
          ) : (
            <div className="search-no-results">
              <p>لا توجد نتائج لـ "{searchTerm}"</p>
              <button 
                onClick={handleSearchSubmit}
                className="search-all-btn"
              >
                ابحث عن "{searchTerm}" في جميع الكتب
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}