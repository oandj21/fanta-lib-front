// Livres.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom"; // Add useNavigate
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
  const navigate = useNavigate(); // Add navigate for programmatic navigation
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("الكل");
  const [canScroll, setCanScroll] = useState(false);
  const genresFilterRef = useRef(null);
  const initialLoadRef = useRef(true); // Track initial load
  const previousBookIdRef = useRef(null); // Track previous book ID

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Handle URL parameters - IMPROVED VERSION
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
      
      // Check if it's a different book than previously selected
      if (previousBookIdRef.current !== bookIdNum) {
        const book = books.find(b => b.id === bookIdNum);
        if (book) {
          // Small delay to ensure smooth transition
          setTimeout(() => {
            setSelectedBook(book);
            previousBookIdRef.current = bookIdNum;
          }, 100);
        }
      }
    } else if (!bookId) {
      // If no book ID in URL, clear selected book
      setSelectedBook(null);
      previousBookIdRef.current = null;
    }
  }, [location.search, books]); // Add books as dependency

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
    setSelectedBook(book);
    previousBookIdRef.current = book.id;
    // Update URL with book ID without causing a navigation/reload
    const url = new URL(window.location);
    url.searchParams.set("book", book.id);
    window.history.pushState({}, "", url);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    previousBookIdRef.current = null;
    // Remove book param from URL
    const url = new URL(window.location);
    url.searchParams.delete("book");
    window.history.pushState({}, "", url); // Use pushState instead of replaceState for better history management
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
          key={selectedBook.id} // Add key to force re-render when book changes
          book={selectedBook} 
          allBooks={books}
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}