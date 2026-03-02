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
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
  const containerRef = useRef(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Scroll to top when component mounts
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only fetch if component is mounted
    if (isMounted.current) {
      dispatch(fetchLivres());
    }
  }, [dispatch]);

  // Handle URL parameters
  useEffect(() => {
    if (!isMounted.current) return;
    
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const bookId = params.get("book");

    if (searchParam) {
      setSearch(searchParam);
    }

    if (bookId && books.length > 0) {
      const book = books.find(b => b.id === parseInt(bookId));
      if (book && isMounted.current) {
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

  // Split genres into two rows (alternating)
  const topRowGenres = [];
  const bottomRowGenres = [];
  
  genres.forEach((genre, index) => {
    if (index % 2 === 0) {
      topRowGenres.push(genre);
    } else {
      bottomRowGenres.push(genre);
    }
  });

  // Check if container can scroll horizontally
  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const scrollWidth = containerRef.current.scrollWidth;
        const clientWidth = containerRef.current.clientWidth;
        
        setCanScroll({
          left: scrollWidth > clientWidth,
          right: scrollWidth > clientWidth
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

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
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
            <div className="genres-filter-wrapper-horizontal">
              {canScroll.left && (
                <button 
                  className="scroll-btn scroll-left" 
                  onClick={scrollLeft}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
              )}
              
              {/* Single container that scrolls both rows */}
              <div 
                className="genres-rows-container-scrollable"
                ref={containerRef}
              >
                <div className="genre-row-horizontal">
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
                <div className="genre-row-horizontal">
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
              
              {canScroll.right && (
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