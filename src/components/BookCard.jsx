import { useState, useEffect, useRef } from "react";
import BookDetailModal from "./BookDetailModal";
import { Eye, ShoppingCart, Check } from "lucide-react";
import { getBookDirection, isArabicText } from "../utils/languageDetector";
import "../css/BookCard.css";

export default function BookCard({ book }) {
  const [showDetail, setShowDetail] = useState(false);
  const [added, setAdded] = useState(false);
  const cardRef = useRef(null);
  
  // Determine book direction
  const direction = getBookDirection(book);
  
  // Check if specific fields are Arabic for potential styling
  const isTitleArabic = isArabicText(book.titre);
  const isAuthorArabic = isArabicText(book.auteur);
  const isCategoryArabic = isArabicText(book.categorie);

  useEffect(() => {
    // Set direction attribute on the card element
    if (cardRef.current) {
      cardRef.current.setAttribute('data-direction', direction);
      cardRef.current.setAttribute('dir', direction);
    }
  }, [direction]);

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
      <div 
        ref={cardRef}
        className="book-card" 
        data-rtl={direction === 'rtl'}
        dir={direction}
      >
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
          <span 
            className="book-category-badge"
            dir={isCategoryArabic ? 'rtl' : 'ltr'}
          >
            {book.categorie || "غير مصنف"}
          </span>
          <h3 
            className="book-title"
            dir={isTitleArabic ? 'rtl' : 'ltr'}
            style={{ textAlign: isTitleArabic ? 'right' : 'left' }}
          >
            {book.titre || "عنوان غير معروف"}
          </h3>
          
          <p 
            className="book-author"
            dir={isAuthorArabic ? 'rtl' : 'ltr'}
            style={{ textAlign: isAuthorArabic ? 'right' : 'left' }}
          >
            {book.auteur || "مؤلف غير معروف"}
          </p>

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