// BookDetailModal.jsx
import { useState } from "react";
import Portal from "./Portal";
import { ShoppingCart, Check, X } from "lucide-react";
import "../css/BookDetailModal.css";

export default function BookDetailModal({ book, onClose }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
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
    setTimeout(() => setAdded(false), 1500);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Helper function to get image URL (copied from BookCard)
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

  return (
    <Portal>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content book-detail-modal">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="book-detail-grid">
            <div className="book-detail-cover">
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

            <div className="book-detail-info">
              <p className="book-genre">{book.categorie || "Non catégorisé"}</p>
              <h2 className="book-title">{book.titre || "Titre inconnu"}</h2>
              <p className="book-author">par {book.auteur || "Auteur inconnu"}</p>

              {book.status === "available" && (
                <p className="stock-info">
                  📦 En stock
                </p>
              )}

              <div className="book-description">
                <h3>Description</h3>
                <p>
                  {book.description || `Découvrez "${book.titre || 'ce livre'}" de ${book.auteur || 'notre auteur'}, un livre captivant dans la catégorie ${book.categorie || 'générale'}.`}
                </p>
              </div>

              <div className="book-detail-footer">
                <button
                  onClick={handleAdd}
                  disabled={book.status !== "available"}
                  className={`btn-add ${added ? 'added' : ''} ${book.status !== "available" ? 'disabled' : ''}`}
                >
                  {added ? (
                    <>
                      <Check size={18} className="btn-icon" />
                      Ajouté au panier !
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} className="btn-icon" />
                      Ajouter au panier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}