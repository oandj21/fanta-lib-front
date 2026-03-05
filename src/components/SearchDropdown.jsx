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

  // Normalize Arabic text function
  const normalizeArabicText = (text) => {
    if (!text) return '';
    
    text = String(text);
    
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[ًٌٍَُِّْ]|[\u064B-\u065F]/g, '')
      .toLowerCase();
  };

  // Filter books based on search term with Arabic normalization
  const filteredBooks = books.filter((book) => {
    const title = normalizeArabicText(book.titre || "");
    const author = normalizeArabicText(book.auteur || "");
    const category = normalizeArabicText(book.categorie || "");
    const term = normalizeArabicText(searchTerm);

    return (
      title.includes(term) ||
      author.includes(term) ||
      category.includes(term)
    );
  }).slice(0, 10);

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

  const handleBookClick = (book) => {
    // Navigate to livres page with book ID
    navigate(`/livres?book=${book.id}`);
    setSearchTerm("");
    setShowResults(false);
    
    // Clear input focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      navigate(`/livres?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
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
        return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images}`;
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images[0]}`;
    }
    
    return 'https://via.placeholder.com/40x60?text=No+Cover';
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
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setShowResults(false);
            }}
            className="clear-sear"
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
                      alt={book.titre}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40x60?text=Error";
                      }}
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
                  </div>
                </div>
              ))}
              <div 
                className="search-footer" 
                onClick={handleSearchSubmit}
                dir={getTextDirection(searchTerm)}
                style={{ textAlign: getTextDirection(searchTerm) === 'rtl' ? 'right' : 'left' }}
              >
                <Search size={14} />
                <span>عرض جميع النتائج لـ "{searchTerm}"</span>
              </div>
            </>
          ) : (
            <div className="search-no-results">
              <p>لا توجد نتائج لـ "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}