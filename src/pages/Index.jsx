// Index.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import heroImage from "../assets/hero-books.jpg";
import { fetchLivres, selectLivres, selectLivresLoading } from "../store/store";
import BookCard from "../components/BookCard";
import BookDetailModal from "../components/BookDetailModal";
import BookCarousel from "../components/BookCarousel";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import "../css/Index.css";

export default function Index() {
  const dispatch = useDispatch();
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  const handleShowDetails = (book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  return (
    <div className="homepage">
      <Header />

      <section className="hero-section">
        <img src={heroImage} alt="Fantasia librairie" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-tagline">Librairie en ligne</p>
          <h1 className="hero-title">
            Bienvenue chez<br />
            <span>Fantasia</span>
          </h1>
          <p className="hero-description">
            Découvrez notre collection exclusive de livres
          </p>
          <div className="hero-buttons">
            <a href="#livres" className="btn-primary">
              Voir les livres
            </a>
            <Link to="/livres" className="btn-secondary">
              Tout le catalogue →
            </Link>
          </div>
        </div>
      </section>

      <section className="carousel-section">
        <div className="section-header">
          <p className="section-subtitle">Nos best-sellers</p>
          <h2 className="section-title">Collection en mouvement</h2>
          <div className="section-divider" />
        </div>
        <BookCarousel books={books} onShowDetails={handleShowDetails} />
      </section>

      <section id="livres" className="books-section">
        <div className="section-header">
          <p className="section-subtitle">Notre collection</p>
          <h2 className="section-title">Nos Livres</h2>
          <div className="section-divider" />
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Chargement des livres...</p>
          </div>
        ) : (
          <div className="books-grid">
            {books.slice(0, 8).map((book, i) => (
              <div key={book.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-up">
                <BookCard book={book} onShowDetails={handleShowDetails} />
              </div>
            ))}
          </div>
        )}
        
        <div className="view-all-container">
          <Link to="/livres" className="btn-view-all">
            Voir tout le catalogue →
          </Link>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2 className="section-title">Nous Contacter</h2>
        <div className="contact-info">
          <p className="contact-item">📧 contact@fantasia.fr</p>
          <p className="contact-item">📞 +212 625 854 078</p>
          <p className="contact-item">📍 Casablanca, Maroc</p>
        </div>
        <Link to="/contact" className="contact-button">
          Nous écrire →
        </Link>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <BookOpen />
            <span>Fantasia</span>
          </div>
          <p className="footer-copyright">© 2026 Fantasia — Tous droits réservés</p>
        </div>
      </footer>

      <WhatsAppFloat />
      
      {/* Modal rendered at root level */}
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={handleCloseDetails} />
      )}
    </div>
  );
}