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
          return `https://fanta-lib-back-production.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        console.error('خطأ في تحليل الصور:', e);
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production.up.railway.app/storage/${images[0]}`;
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
                alt={book.titre || "غلاف الكتاب"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300x400?text=Image+Error';
                }}
              />
              <span className={`status-badge ${book.status}`}>
                {book.status === "available" ? "متوفر" : "غير متوفر"}
              </span>
            </div>

            <div className="book-detail-info">
              <p className="book-genre">{book.categorie || "غير مصنف"}</p>
              <h2 className="book-title">{book.titre || "عنوان غير معروف"}</h2>
              <p className="book-author">بقلم {book.auteur || "مؤلف غير معروف"}</p>

              {book.status === "available" && (
                <p className="stock-info">
                  📦 متوفر في المخزون
                </p>
              )}

              <div className="book-description">
                <h3>الوصف</h3>
                <p>
                  {book.description || `اكتشف "${book.titre || 'هذا الكتاب'}" من تأليف ${book.auteur || 'مؤلفنا'}`}
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
                      تمت الإضافة إلى السلة!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} className="btn-icon" />
                      أضف إلى السلة
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