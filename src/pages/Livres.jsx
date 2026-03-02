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
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const isScrollingRef = useRef(false); // Prevent infinite scroll loop

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

  // Sync scroll positions between rows
  useEffect(() => {
    const topRow = topRowRef.current;
    const bottomRow = bottomRowRef.current;
    
    if (!topRow || !bottomRow) return;
    
    const handleTopScroll = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      bottomRow.scrollTo({ left: topRow.scrollLeft, behavior: 'auto' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    };
    
    const handleBottomScroll = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      topRow.scrollTo({ left: bottomRow.scrollLeft, behavior: 'auto' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    };
    
    topRow.addEventListener('scroll', handleTopScroll);
    bottomRow.addEventListener('scroll', handleBottomScroll);
    
    return () => {
      topRow.removeEventListener('scroll', handleTopScroll);
      bottomRow.removeEventListener('scroll', handleBottomScroll);
    };
  }, []);

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

  // Check if rows can scroll horizontally
  useEffect(() => {
    const checkScroll = () => {
      if (topRowRef.current && bottomRowRef.current) {
        const topScrollWidth = topRowRef.current.scrollWidth;
        const topClientWidth = topRowRef.current.clientWidth;
        const bottomScrollWidth = bottomRowRef.current.scrollWidth;
        const bottomClientWidth = bottomRowRef.current.clientWidth;
        
        // Check if either row can scroll
        const canScrollAny = topScrollWidth > topClientWidth || bottomScrollWidth > bottomClientWidth;
        
        setCanScroll({
          left: canScrollAny,
          right: canScrollAny
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
    if (topRowRef.current && bottomRowRef.current) {
      const newScrollLeft = Math.max(0, topRowRef.current.scrollLeft - 200);
      topRowRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      bottomRowRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (topRowRef.current && bottomRowRef.current) {
      const maxScrollLeft = topRowRef.current.scrollWidth - topRowRef.current.clientWidth;
      const newScrollLeft = Math.min(maxScrollLeft, topRowRef.current.scrollLeft + 200);
      topRowRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      bottomRowRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
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
              <div className="genres-rows-container">
                <div 
                  className="genre-row-horizontal"
                  ref={topRowRef}
                >
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
                <div 
                  className="genre-row-horizontal"
                  ref={bottomRowRef}
                >
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