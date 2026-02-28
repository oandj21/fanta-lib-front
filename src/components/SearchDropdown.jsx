import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { selectLivres } from "../store/store";
import "../css/SearchDropdown.css";

export default function SearchDropdown({ isMobile = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const books = useSelector(selectLivres);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Filter books based on search term
  const filteredBooks = books.filter((book) => {
    const title = book.titre || "";
    const author = book.auteur || "";
    const category = book.categorie || "";
    const term = searchTerm.toLowerCase();

    return (
      title.toLowerCase().includes(term) ||
      author.toLowerCase().includes(term) ||
      category.toLowerCase().includes(term)
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

  const handleBookClick = (book) => {
    // Navigate to livres page and open the book modal
    navigate(`/livres?book=${book.id}`);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      // Navigate to livres page with search query
      navigate(`/livres?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/40x60?text=No+Cover';
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `https://fanta-lib-back-production.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        // If parsing fails, treat as direct filename
        return `https://fanta-lib-back-production.up.railway.app/storage/${images}`;
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production.up.railway.app/storage/${images[0]}`;
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
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
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
                    <h4 className="result-title">{book.titre || "عنوان غير معروف"}</h4>
                    <p className="result-author">{book.auteur || "مؤلف غير معروف"}</p>
                  </div>
                </div>
              ))}
              <div className="search-footer" onClick={handleSearchSubmit}>
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