import { useState } from "react";
import BookDetailModal from "./BookDetailModal";
import { Eye, ShoppingCart, Check } from "lucide-react";
import "../css/BookCard.css";

export default function BookCard({ book }) {
  const [showDetail, setShowDetail] = useState(false);
  const [added, setAdded] = useState(false);

  // Helper function to detect if text is Arabic
  const isArabicText = (text) => {
    if (!text) return false;
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  };

  // Determine text direction based on title or author
  const textDirection = isArabicText(book.titre) || isArabicText(book.auteur) ? 'rtl' : 'ltr';

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/300x400?text=No+Cover';
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        console.error('خطأ في تحليل الصور:', e);
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images[0]}`;
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
    console.log("فتح التفاصيل للكتاب:", book);
    setShowDetail(true);
  };

  return (
    <>
      <div className="book-card" data-direction={textDirection}>
        <div className="book-cover">
          <img 
            src={getImageUrl(book.images)} 
            alt={book.titre || "غلاف الكتاب"} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x400?text=Image+Error';
            }}
          />
          {/* Status Badge */}
          {book.status && (
            <span className={`status-bad ${book.status}`}>
              {book.status === "available" ? "متوفر" : "غير متوفر"}
            </span>
          )}
        </div>

        <div className="book-info">
          <span className="book-category-badge">
            {book.categorie || "غير مصنف"}
          </span>
          <h3 className="book-title">{book.titre || "عنوان غير معروف"}</h3>
          
          <p className="book-author">{book.auteur || "مؤلف غير معروف"}</p>

          <div className="book-footer">
            <button 
              onClick={handleDetailsClick}
              className="btn-details"
              title="عرض التفاصيل"
              type="button"
            >
              <Eye size={18} />
              <span>التفاصيل</span>
            </button>

            <button
              onClick={handleAdd}
              disabled={book.status !== "available"}
              className={`btn-cart ${added ? 'added' : ''} ${book.status !== "available" ? 'disabled' : ''}`}
              title="أضف إلى السلة"
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
            console.log("إغلاق النافذة");
            setShowDetail(false);
          }} 
        />
      )}
    </>
  );
}