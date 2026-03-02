// Livres.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("الكل");
  const [canScroll, setCanScroll] = useState({ top: false, bottom: false });
  const genresFilterRef = useRef(null);

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
      const book = books.find(b => b.id === parseInt(bookId));
      if (book) {
        setSelectedBook(book);
      }
    }
  }, [location.search, books]);

  // Get unique genres from books, filtering out empty/null values
  const genres = ["الكل", ...Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "")
  ))];

  // Split genres into two rows
  const midIndex = Math.ceil(genres.length / 2);
  const topRowGenres = genres.slice(0, midIndex);
  const bottomRowGenres = genres.slice(midIndex);

  // Check if genres filter can scroll vertically
  useEffect(() => {
    const checkScroll = () => {
      if (genresFilterRef.current) {
        const { scrollHeight, clientHeight } = genresFilterRef.current;
        setCanScroll({
          top: scrollHeight > clientHeight,
          bottom: scrollHeight > clientHeight
        });
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
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    // Remove book param from URL
    const url = new URL(window.location);
    url.searchParams.delete("book");
    window.history.replaceState({}, "", url);
  };

  const scrollUp = () => {
    if (genresFilterRef.current) {
      genresFilterRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (genresFilterRef.current) {
      genresFilterRef.current.scrollBy({ top: 100, behavior: 'smooth' });
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
            <div className="genres-filter-wrapper-vertical">
              {canScroll.top && (
                <button 
                  className="scroll-btn scroll-up" 
                  onClick={scrollUp}
                  aria-label="Scroll up"
                >
                  ↑
                </button>
              )}
              <div 
                className={`genres-filter-vertical ${canScroll.top || canScroll.bottom ? 'can-scroll' : ''}`}
                ref={genresFilterRef}
              >
                <div className="genre-row">
                  {topRowGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`genre-btn ${genre === g ? "active" : ""}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="genre-row">
                  {bottomRowGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`genre-btn ${genre === g ? "active" : ""}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              {canScroll.bottom && (
                <button 
                  className="scroll-btn scroll-down" 
                  onClick={scrollDown}
                  aria-label="Scroll down"
                >
                  ↓
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
              {filtered.length} كتاب تم العثور {filtered.length > 1 ? "عليهم" : "عليه"}
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
                    <BookCard book={book} onShowDetails={handleShowDetails} />
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
        <BookDetailModal book={selectedBook} onClose={handleCloseDetails} />
      )}
    </div>
  );
}