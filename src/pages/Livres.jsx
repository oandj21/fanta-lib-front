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
  const [canScrollArabic1, setCanScrollArabic1] = useState(false);
  const [canScrollArabic2, setCanScrollArabic2] = useState(false);
  const [canScrollEnglish1, setCanScrollEnglish1] = useState(false);
  const [canScrollEnglish2, setCanScrollEnglish2] = useState(false);
  
  const arabicGenresFilterRef1 = useRef(null);
  const arabicGenresFilterRef2 = useRef(null);
  const englishGenresFilterRef1 = useRef(null);
  const englishGenresFilterRef2 = useRef(null);
  
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

  // Split Arabic genres into two rows
  const midArabic = Math.ceil(arabicGenres.length / 2);
  const arabicGenresRow1 = ["الكل", ...arabicGenres.slice(0, midArabic)];
  const arabicGenresRow2 = arabicGenres.slice(midArabic);

  // Split English genres into two rows
  const midEnglish = Math.ceil(englishGenres.length / 2);
  const englishGenresRow1 = ["All", ...englishGenres.slice(0, midEnglish)];
  const englishGenresRow2 = englishGenres.slice(midEnglish);

  // Check scroll for each filter row
  useEffect(() => {
    const checkScroll = () => {
      if (arabicGenresFilterRef1.current) {
        const { scrollWidth, clientWidth } = arabicGenresFilterRef1.current;
        setCanScrollArabic1(scrollWidth > clientWidth);
      }
      if (arabicGenresFilterRef2.current) {
        const { scrollWidth, clientWidth } = arabicGenresFilterRef2.current;
        setCanScrollArabic2(scrollWidth > clientWidth);
      }
      if (englishGenresFilterRef1.current) {
        const { scrollWidth, clientWidth } = englishGenresFilterRef1.current;
        setCanScrollEnglish1(scrollWidth > clientWidth);
      }
      if (englishGenresFilterRef2.current) {
        const { scrollWidth, clientWidth } = englishGenresFilterRef2.current;
        setCanScrollEnglish2(scrollWidth > clientWidth);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [arabicGenresRow1, arabicGenresRow2, englishGenresRow1, englishGenresRow2]);

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
    <div className="filter-row">
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
            {/* Arabic Categories - Row 1 */}
            {arabicGenresRow1.length > 1 && renderFilterRow(
              "التصنيفات العربية - الصف الأول", 
              arabicGenresRow1, 
              arabicGenresFilterRef1, 
              canScrollArabic1,
              'arabic1'
            )}
            
            {/* Arabic Categories - Row 2 */}
            {arabicGenresRow2.length > 0 && renderFilterRow(
              "التصنيفات العربية - الصف الثاني", 
              arabicGenresRow2, 
              arabicGenresFilterRef2, 
              canScrollArabic2,
              'arabic2'
            )}
            
            {/* English Categories - Row 1 */}
            {englishGenresRow1.length > 1 && renderFilterRow(
              "English Categories - Row 1", 
              englishGenresRow1, 
              englishGenresFilterRef1, 
              canScrollEnglish1,
              'english1'
            )}
            
            {/* English Categories - Row 2 */}
            {englishGenresRow2.length > 0 && renderFilterRow(
              "English Categories - Row 2", 
              englishGenresRow2, 
              englishGenresFilterRef2, 
              canScrollEnglish2,
              'english2'
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