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
  const [genre, setGenre] = useState("الكل");
  const [canScroll, setCanScroll] = useState(false);
  const genresFilterRef = useRef(null);
  const previousBookIdRef = useRef(null);
  const lastClickTimeRef = useRef(0); // Add this to track click time

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Handle URL parameters - FIXED VERSION
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const bookId = params.get("book");

    if (searchParam) {
      setSearch(searchParam);
    }

    // Only process book ID if books are loaded
    if (bookId && books.length > 0) {
      const bookIdNum = parseInt(bookId);
      const book = books.find(b => b.id === bookIdNum);
      
      if (book) {
        // Always open the modal, even if it's the same book
        // This allows re-opening the same book modal
        setSelectedBook(book);
        previousBookIdRef.current = bookIdNum;
      }
    } else if (!bookId) {
      // If no book ID in URL, clear selected book
      setSelectedBook(null);
      previousBookIdRef.current = null;
    }
  }, [location.search, books]); // Keep books as dependency

  // Add this new useEffect to handle popstate events (browser back/forward)
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

  // Get unique genres from books, filtering out empty/null values
  const genres = ["الكل", ...Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "")
  ))];

  // Check if genres filter can scroll horizontally
  useEffect(() => {
    const checkScroll = () => {
      if (genresFilterRef.current) {
        const { scrollWidth, clientWidth } = genresFilterRef.current;
        setCanScroll(scrollWidth > clientWidth);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [genres]);

  const filtered = books.filter((b) => {
    const title = b.titre || "";
    const author = b.auteur || "";
    const category = b.categorie || "";

    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      author.toLowerCase().includes(search.toLowerCase());

    const matchGenre = genre === "الكل" || category === genre;
    return matchSearch && matchGenre;
  });

  const handleShowDetails = (book) => {
    const now = Date.now();
    
    setSelectedBook(book);
    previousBookIdRef.current = book.id;
    lastClickTimeRef.current = now;
    
    // Update URL with book ID without causing a navigation/reload
    const url = new URL(window.location);
    url.searchParams.set("book", book.id);
    window.history.pushState({}, "", url);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    previousBookIdRef.current = null;
    lastClickTimeRef.current = 0;
    
    // Remove book param from URL
    const url = new URL(window.location);
    url.searchParams.delete("book");
    window.history.pushState({}, "", url);
  };

  const scrollLeft = () => {
    if (genresFilterRef.current) {
      genresFilterRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (genresFilterRef.current) {
      genresFilterRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="livres-page">
      <Header />

      <section className="page-her">
        <div className="page-hero-content">
          <BookOpen />
          <h1>قائمة الكتب المتوفرة</h1>
        </div>
      </section>

      <section className="books-section">
        <section className="filters-sectio">
          <div className="filters-container">
            <div className="genres-filter-wrapper">
              {canScroll && (
                <button 
                  className="scroll-btn scroll-left" 
                  onClick={scrollLeft}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
              )}
              <div 
                className={`genres-filter ${canScroll ? 'can-scroll' : ''}`}
                ref={genresFilterRef}
              >
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`genre-btn ${genre === g ? "active" : ""}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {canScroll && (
                <button 
                  className="scroll-btn scroll-right" 
                  onClick={scrollRight}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              )}
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
      
      {/* Modal rendered at root level */}
      {selectedBook && (
        <BookDetailModal 
          key={selectedBook.id + (selectedBook.id === previousBookIdRef.current ? Date.now() : '')} // Force re-render when same book is clicked
          book={selectedBook} 
          allBooks={books}
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}// Livres.jsx
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
  const [genre, setGenre] = useState("الكل");
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

  // Check if text contains Arabic characters
  const isArabicText = (text) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  };

  // Get unique genres
  const allGenres = Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "")
  ));

  // Split genres into Arabic and English
  const arabicGenres = allGenres.filter(genre => isArabicText(genre));
  const englishGenres = allGenres.filter(genre => !isArabicText(genre));

  // Add "الكل" and "All" to respective arrays
  const arabicGenresWithAll = ["الكل", ...arabicGenres];
  const englishGenresWithAll = ["All", ...englishGenres];

  // Check scroll for each filter row
  useEffect(() => {
    const checkScroll = () => {
      if (arabicGenresFilterRef.current) {
        const { scrollWidth, clientWidth } = arabicGenresFilterRef.current;
        setCanScrollArabic(scrollWidth > clientWidth);
      }
      if (englishGenresFilterRef.current) {
        const { scrollWidth, clientWidth } = englishGenresFilterRef.current;
        setCanScrollEnglish(scrollWidth > clientWidth);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [arabicGenres, englishGenres]);

  const filtered = books.filter((b) => {
    const title = b.titre || "";
    const author = b.auteur || "";
    const category = b.categorie || "";

    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      author.toLowerCase().includes(search.toLowerCase());

    const matchGenre = 
      genre === "الكل" || 
      genre === "All" || 
      category === genre;
      
    return matchSearch && matchGenre;
  });

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

  // Render a filter row
  const renderFilterRow = (title, genres, ref, canScroll, rowType) => (
    <div className="filter-row" key={rowType}>
      <h3 className="filter-row-title">{title}</h3>
      <div className="genres-filter-wrapper">
        {canScroll && (
          <button 
            className="scroll-btn scroll-left" 
            onClick={() => scrollLeft(ref)}
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}
        <div 
          className={`genres-filter ${canScroll ? 'can-scroll' : ''}`}
          ref={ref}
        >
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`genre-btn ${genre === g ? "active" : ""}`}
            >
              {g}
            </button>
          ))}
        </div>
        {canScroll && (
          <button 
            className="scroll-btn scroll-right" 
            onClick={() => scrollRight(ref)}
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="livres-page">
      <Header />

      <section className="page-her">
        <div className="page-hero-content">
          <BookOpen />
          <h1>قائمة الكتب المتوفرة</h1>
        </div>
      </section>

      <section className="books-section">
        <section className="filters-sectio">
          <div className="filters-container">
            {/* Arabic Categories Row */}
            {arabicGenresWithAll.length > 0 && renderFilterRow(
              "التصنيفات العربية", 
              arabicGenresWithAll, 
              arabicGenresFilterRef, 
              canScrollArabic,
              'arabic'
            )}
            
            {/* English Categories Row */}
            {englishGenresWithAll.length > 0 && renderFilterRow(
              "English Categories", 
              englishGenresWithAll, 
              englishGenresFilterRef, 
              canScrollEnglish,
              'english'
            )}
          </div>
        </section>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">جاري تحميل الكتب...</p>
          </div>
        ) : (
          <>
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