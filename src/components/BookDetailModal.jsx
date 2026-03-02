// BookDetailModal.jsx
import { useState } from "react";
import Portal from "./Portal";
import { ShoppingCart, Check, X } from "lucide-react";
import useLanguageDirection from "../utils/useLanguageDirection";
import "../css/BookDetailModal.css";

export default function BookDetailModal({ book, onClose }) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getTextDirection } = useLanguageDirection();

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

  // Helper function to get image URL with better error handling
  const getImageUrl = (images) => {
    if (imageError) {
      return 'https://via.placeholder.com/400x500?text=No+Cover';
    }
    
    if (!images) return 'https://via.placeholder.com/400x500?text=No+Cover';
    
    try {
      if (typeof images === 'string') {
        if (images.startsWith('http')) {
          return images;
        }
        
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${parsed[0]}`;
          }
        } catch (e) {
          return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images}`;
        }
      }
      
      if (Array.isArray(images) && images.length > 0) {
        return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images[0]}`;
      }
    } catch (e) {
      console.error('Error processing image:', e);
    }
    
    return 'https://via.placeholder.com/400x500?text=No+Cover';
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Portal>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content book-detail-modal" data-rtl="true">
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
          
          <div className="book-detail-grid">
            <div className="book-detail-cover">
              <img 
                src={getImageUrl(book.images)} 
                alt={book.titre || "غلاف الكتاب"}
                onError={handleImageError}
                loading="lazy"
              />
              {/* Status Badge */}
              {book.status && (
                <span className={`status-bad ${book.status}`}>
                  {book.status === "available" ? "متوفر" : "غير متوفر"}
                </span>
              )}
            </div>

            <div className="book-detail-info">
              {/* Title with dynamic direction */}
              <h2 
                className="book-title"
                dir={getTextDirection(book.titre)}
                style={{ textAlign: getTextDirection(book.titre) === 'rtl' ? 'right' : 'left' }}
              >
                {book.titre || "عنوان غير معروف"}
              </h2>
              
              {/* Author with dynamic direction */}
              <p 
                className="book-author"
                dir={getTextDirection(book.auteur)}
                style={{ textAlign: getTextDirection(book.auteur) === 'rtl' ? 'right' : 'left' }}
              >
                بقلم {book.auteur || "مؤلف غير معروف"}
              </p>
              
              {/* Category Badge */}
              <span className="book-category-badge">
                {book.categorie || "غير مصنف"}
              </span>

              

              <div className="book-description">
                <h3>الوصف</h3>
                {/* Description with dynamic direction */}
                <p 
                  dir={getTextDirection(book.description)}
                  style={{ textAlign: getTextDirection(book.description) === 'rtl' ? 'right' : 'left' }}
                >
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
                      <Check size={18} className="btn-icon1" />
                      تمت الإضافة إلى السلة!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} className="btn-icon1" />
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