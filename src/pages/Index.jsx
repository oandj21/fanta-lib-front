// Index.jsx
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { fetchLivres, selectLivres, selectLivresLoading } from "../store/store";
import BookCard from "../components/BookCard";
import BookDetailModal from "../components/BookDetailModal";
import BookCarousel from "../components/BookCarousel";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import HeroSlider from "../components/HeroSlider";
import "../css/Index.css";

export default function Index() {
  const dispatch = useDispatch();
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);
  
  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  const handleShowDetails = (book) => {
    setSelectedBook(book);
    // Notify carousel that modal is opening
    if (carouselRef.current) {
      carouselRef.current.onModalOpen();
    }
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
    // Notify carousel that modal is closing
    if (carouselRef.current) {
      carouselRef.current.onModalClose();
    }
  };

  return (
    <div className="homepage">
      <Header />
      
      <HeroSlider />

      <section className="carousel-section">
        <div className="section-header">
          <h2 className="section-title">أحدث الكتب</h2>
          <div className="section-divider" />
        </div>
        <BookCarousel 
          ref={carouselRef}
          onShowDetails={handleShowDetails}
          allBooks={books}
        />
      </section>

      <section id="livres" className="books-section">
        <div className="section-header">
          <p className="section-subtitle">مجموعتنا</p>
          <h2 className="section-title">كتبنا</h2>
          <div className="section-divider" />
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">جاري تحميل الكتب...</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.slice(0, 8).map((book, i) => (
              <div key={book.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-up">
                <BookCard 
                  book={book} 
                  allBooks={books}
                  onShowDetails={handleShowDetails}
                />
              </div>
            ))}
          </div>
        )}
        
      </section>

      <section id="contact" className="contact-section">
        <h2 className="section-title">اتصل بنا</h2>
        <div className="contact-info">
          <p className="contact-item">📧 info.fantasia.library@gmail.com</p>
          <p className="contact-item">📞 +212 688 069 942</p>
          <p className="contact-item">📍 مكناس، المغرب</p>
        </div>
        <Link to="/contact" className="contact-button">
          راسلنا ←
        </Link>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <BookOpen />
            <span>فانتازيا</span>
          </div>
          <p className="footer-copyright">© 2026 فانتازيا — جميع الحقوق محفوظة</p>
        </div>
      </footer>

      <WhatsAppFloat />
      
      {/* Modal rendered at root level */}
      {selectedBook && (
        <BookDetailModal 
          book={selectedBook} 
          allBooks={books}
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}