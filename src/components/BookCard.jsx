import { useState } from "react";
import BookDetailModal from "./BookDetailModal";
import { Eye, ShoppingCart, Check } from "lucide-react";
import "../css/BookCard.css";

export default function BookCard({ book }) {
  const [showDetail, setShowDetail] = useState(false);
  const [added, setAdded] = useState(false);

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/300x400?text=No+Cover';
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `http://127.0.0.1:8000/storage/${parsed[0]}`;
        }
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `http://127.0.0.1:8000/storage/${images[0]}`;
    }
    
    return 'https://via.placeholder.com/300x400?text=No+Cover';
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.status !== "available") return;
    
    const cartItem = {
      id: book.id,
      titre: book.titre,
      auteur: book.auteur,
      prix_achat: book.prix_achat,
      images: book.images,
      quantity: 1
    };
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    window.dispatchEvent(new Event('storage'));
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleDetailsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Opening details for book:", book);
    setShowDetail(true);
  };

  return (
    <>
      <div className="book-card">
        <div className="book-cover">
          <img 
            src={getImageUrl(book.images)} 
            alt={book.titre || "Book cover"} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x400?text=Image+Error';
            }}
          />
          <span className={`status-badge ${book.status}`}>
            {book.status === "available" ? "Disponible" : "Rupture"}
          </span>
        </div>

        <div className="book-info">
          <p className="book-genre">{book.categorie || "Non catégorisé"}</p>
          <h3 className="book-title">{book.titre || "Titre inconnu"}</h3>
          <p className="book-author">{book.auteur || "Auteur inconnu"}</p>

          <div className="book-footer">
            <button 
              onClick={handleDetailsClick}
              className="btn-details"
              title="Voir détails"
              type="button"
            >
              <Eye size={18} />
              <span>Détails</span>
            </button>

            <button
              onClick={handleAdd}
              disabled={book.status !== "available"}
              className={`btn-cart ${added ? 'added' : ''} ${book.status !== "available" ? 'disabled' : ''}`}
              title="Ajouter au panier"
              type="button"
            >
              {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            </button>
          </div>
        </div>
      </div>

      {showDetail && (
        <BookDetailModal 
          book={book} 
          onClose={() => {
            console.log("Closing modal");
            setShowDetail(false);
          }} 
        />
      )}
    </>
  );
}