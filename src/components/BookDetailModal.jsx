// BookDetailModal.jsx
import { useState } from "react";
import Portal from "./Portal";
import { ShoppingCart, Check, X } from "lucide-react";
import useLanguageDirection from "../utils/useLanguageDirection";
import "../css/BookDetailModal.css";

export default function BookDetailModal({ book, allBooks = [], onClose }) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getTextDirection } = useLanguageDirection();

  // Helper function to find books with same ISBN
  const findBooksByISBN = (currentBook, booksList) => {
    if (!currentBook.isbn || !booksList || booksList.length === 0) {
      return [currentBook];
    }
    
    const sameISBNBooks = booksList.filter(b => 
      b.isbn && b.isbn.toString().trim() === currentBook.isbn.toString().trim()
    );
    
    return sameISBNBooks.length > 0 ? sameISBNBooks : [currentBook];
  };

  const handleAdd = () => {
    // Get current cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Find all books with the same ISBN
    const booksToAdd = findBooksByISBN(book, allBooks);
    let addedCount = 0;
    let newItemsCount = 0;
    
    // Add each book to cart (avoiding duplicates)
    booksToAdd.forEach(bookToAdd => {
      const existingItemIndex = cart.findIndex(item => item.id === bookToAdd.id);
      
      if (existingItemIndex >= 0) {
        // If already exists, increment quantity
        cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
        addedCount++;
      } else {
        // If not exists, add new item
        cart.push({
          id: bookToAdd.id,
          titre: bookToAdd.titre,
          auteur: bookToAdd.auteur,
          prix_achat: bookToAdd.prix_achat,
          images: bookToAdd.images,
          isbn: bookToAdd.isbn,
          categorie: bookToAdd.categorie,
          quantity: 1
        });
        addedCount++;
        newItemsCount++;
      }
    });
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch events
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
    
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
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

  // Get books with same ISBN for display (excluding current book)
  const sameISBNBooks = book.isbn && allBooks.length > 0 
    ? allBooks.filter(b => b.isbn && b.isbn.toString().trim() === book.isbn.toString().trim() && b.id !== book.id)
    : [];

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

              {/* ISBN Display - Show if available */}
              {book.isbn && (
                <div className="book-isbn">
                  <span className="isbn-label">ISBN:</span>
                  <span className="isbn-value">{book.isbn}</span>
                </div>
              )}

              {/* Other Editions Section - Show if there are books with same ISBN */}
              {sameISBNBooks.length > 0 && (
                <div className="other-editions">
                  <h3>إصدارات أخرى من نفس ISBN:</h3>
                  <ul className="editions-list">
                    {sameISBNBooks.map(otherBook => (
                      <li key={otherBook.id} className="edition-item">
                        <span className="edition-title">{otherBook.titre}</span>
                        <span className="edition-author"> - {otherBook.auteur || "مؤلف غير معروف"}</span>
                        {otherBook.status === "available" ? (
                          <span className="edition-status available">متوفر</span>
                        ) : (
                          <span className="edition-status unavailable">غير متوفر</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="edition-note">
                    *عند إضافة هذا الكتاب إلى السلة، سيتم إضافة جميع الإصدارات المتاحة من نفس ISBN
                  </p>
                </div>
              )}

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
                      {sameISBNBooks.length > 0 
                        ? `تمت إضافة ${sameISBNBooks.length + 1} كتب إلى السلة!` 
                        : "تمت الإضافة إلى السلة!"}
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} className="btn-icon1" />
                      {sameISBNBooks.length > 0 
                        ? `أضف إلى السلة (+${sameISBNBooks.length} إصدارات أخرى)` 
                        : "أضف إلى السلة"}
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