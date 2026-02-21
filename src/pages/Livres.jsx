// Livres.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLivres, selectLivres, selectLivresLoading } from "../store/store";
import BookCard from "../components/BookCard";
import BookDetailModal from "../components/BookDetailModal";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { BookOpen } from "lucide-react";
import "../css/Livres.css";

export default function Livres() {
  const dispatch = useDispatch();
  const books = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Tous");

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Get unique genres from books, filtering out empty/null values
  const genres = ["Tous", ...Array.from(new Set(
    books
      .map((b) => b.categorie)
      .filter(cat => cat && cat.trim() !== "")
  ))];

  const filtered = books.filter((b) => {
    const title = b.titre || "";
    const author = b.auteur || "";
    const category = b.categorie || "";

    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      author.toLowerCase().includes(search.toLowerCase());

    const matchGenre = genre === "Tous" || category === genre;
    return matchSearch && matchGenre;
  });

  const handleShowDetails = (book) => {
    setSelectedBook(book);
  };

  const handleCloseDetails = () => {
    setSelectedBook(null);
  };

  return (
    <div className="livres-page">
      <Header />

      <section className="page-hero">
        <div className="page-hero-content">
          <BookOpen />
          <h1>Notre Catalogue</h1>
        </div>
        <p>Découvrez toute notre collection de livres soigneusement sélectionnés</p>
      </section>

      <section className="filters-section">
        <div className="filters-container">
          <input
            type="text"
            placeholder="Rechercher un livre ou un auteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <div className="genres-filter">
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
        </div>
      </section>

      <section className="books-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Chargement des livres...</p>
          </div>
        ) : (
          <>
            <p className="results-count">
              {filtered.length} livre{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
            </p>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <BookOpen />
                <p>Aucun livre trouvé</p>
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