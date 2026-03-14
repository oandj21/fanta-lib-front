// Livres.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchLivres, selectLivres, selectLivresLoading } from "../store/store";
import BookCard from "../components/BookCard";
import BookDetailModal from "../components/BookDetailModal";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { BookOpen } from "lucide-react";
import "../css/Livres.css";

export default function Livres() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("الكل"); // Unified selected genre
  const [canScrollArabic, setCanScrollArabic] = useState(false);
  const [canScrollEnglish, setCanScrollEnglish] = useState(false);
  
  const arabicGenresFilterRef = useRef(null);
  const englishGenresFilterRef = useRef(null);
  const previousBookIdRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const bookId = params.get("book");

    if (searchParam) {
      setSearch(searchParam);
    }

    if (bookId && books.length > 0) {
      const bookIdNum = parseInt(bookId);
      const book = books.find(b => b.id === bookIdNum);
      
      if (book) {
        setSelectedBook(book);
        previousBookIdRef.current = bookIdNum;
      }
    } else if (!bookId) {
      setSelectedBook(null);
      previousBookIdRef.current = null;
    }
  }, [location.search, books]);

  // Handle popstate events
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const bookId = params.get("book");
      
      if (!bookId && selectedBook) {
        setSelectedBook(null);
        previousBookIdRef.current = null;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedBook]);

  // Separate categories by language
  const arabicCategories = ["الكل", ...Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "" && /[\u0600-\u06FF]/.test(cat)) // Arabic Unicode range
  ))];

  const englishCategories = ["All", ...Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "" && !/[\u0600-\u06FF]/.test(cat)) // Non-Arabic
  ))];

  // Check if Arabic genres filter can scroll horizontally
  useEffect(() => {
    const checkArabicScroll = () => {
      if (arabicGenresFilterRef.current) {
        const { scrollWidth, clientWidth } = arabicGenresFilterRef.current;
        setCanScrollArabic(scrollWidth > clientWidth);
      }
    };
    
    checkArabicScroll();
    window.addEventListener('resize', checkArabicScroll);
    
    return () => window.removeEventListener('resize', checkArabicScroll);
  }, [arabicCategories]);

  // Check if English genres filter can scroll horizontally
  useEffect(() => {
    const checkEnglishScroll = () => {
      if (englishGenresFilterRef.current) {
        const { scrollWidth, clientWidth } = englishGenresFilterRef.current;
        setCanScrollEnglish(scrollWidth > clientWidth);
      }
    };
    
    checkEnglishScroll();
    window.addEventListener('resize', checkEnglishScroll);
    
    return () => window.removeEventListener('resize', checkEnglishScroll);
  }, [englishCategories]);

  const filtered = books.filter((b) => {
    const title = b.titre || "";
    const author = b.auteur || "";
    const category = b.categorie || "";

    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      author.toLowerCase().includes(search.toLowerCase());

    // Unified genre filter logic
    let matchGenre = true;
    
    if (selectedGenre === "الكل" || selectedGenre === "All") {
      // If "الكل" or "All" is selected, show all books
      matchGenre = true;
    } else {
      // Otherwise, match the exact category
      matchGenre = category === selectedGenre;
    }
    
    return matchSearch && matchGenre;
  });

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
  };

  const handleShowDetails = (book) => {
    const now = Date.now();
    
    setSelectedBook(book);
    previousBookIdRef.current = book.id;
    lastClickTimeRef.current = now;
    
    const url = new URL(window.location);
    url.searchParams.set("book", book.id);
    window.history.pushState({}, "", url);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    previousBookIdRef.current = null;
    lastClickTimeRef.current = 0;
    
    const url = new URL(window.location);
    url.searchParams.delete("book");
    window.history.pushState({}, "", url);
  };

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="livres-page">
      <Header />

      <section className="page-hero">
        <div className="page-hero-content">
          <BookOpen />
          <h1>قائمة الكتب المتوفرة</h1>
        </div>
      </section>

      <section className="books-section">
        <section className="filters-section">
          <div className="filters-container-vertical">
            
            {/* Arabic Categories Filter - Top */}
            <div className="filter-group">
              <h3 className="filter-title">التصنيفات</h3>
              <div className="genres-filter-wrapper">
                {canScrollArabic && (
                  <button 
                    className="scroll-btn scroll-left" 
                    onClick={() => scrollLeft(arabicGenresFilterRef)}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                )}
                <div 
                  className={`genres-filter ${canScrollArabic ? 'can-scroll' : ''}`}
                  ref={arabicGenresFilterRef}
                >
                  {arabicCategories.map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenreSelect(g)}
                      className={`genre-btn ${selectedGenre === g ? "active" : ""}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {canScrollArabic && (
                  <button 
                    className="scroll-btn scroll-right" 
                    onClick={() => scrollRight(arabicGenresFilterRef)}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>

            {/* English Categories Filter - Bottom */}
            <div className="filter-group">
              <h3 className="filter-title">Categories</h3>
              <div className="genres-filter-wrapper">
                {canScrollEnglish && (
                  <button 
                    className="scroll-btn scroll-left" 
                    onClick={() => scrollLeft(englishGenresFilterRef)}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                )}
                <div 
                  className={`genres-filter ${canScrollEnglish ? 'can-scroll' : ''}`}
                  ref={englishGenresFilterRef}
                >
                  {englishCategories.map((g) => (
                    <button
                      key={g}
                      onClick={() => handleGenreSelect(g)}
                      className={`genre-btn ${selectedGenre === g ? "active" : ""}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {canScrollEnglish && (
                  <button 
                    className="scroll-btn scroll-right" 
                    onClick={() => scrollRight(englishGenresFilterRef)}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>

          </div>
        </section>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">جاري تحميل الكتب...</p>
          </div>
        ) : (
          <>
            <p className="results-count">
            </p>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <BookOpen />
                <p>لم يتم العثور على كتب</p>
              </div>
            ) : (
              <div className="books-grid">
                {filtered.map((book, i) => (
                  <div key={book.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
                    <BookCard 
                      book={book} 
                      allBooks={books}
                      onShowDetails={handleShowDetails}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <WhatsAppFloat />
      
      {selectedBook && (
        <BookDetailModal 
          key={selectedBook.id + (selectedBook.id === previousBookIdRef.current ? Date.now() : '')}
          book={selectedBook} 
          allBooks={books}
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}