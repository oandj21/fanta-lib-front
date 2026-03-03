// components/BookCard.jsx
import { useState } from "react";
import BookDetailModal from "./BookDetailModal";
import { Eye, ShoppingCart, Check, BookOpen } from "lucide-react";
import useLanguageDirection from "../utils/useLanguageDirection";
import "../css/BookCard.css";

export default function BookCard({ book }) {
  const [showDetail, setShowDetail] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getTextDirection, getClassName } = useLanguageDirection();

  // Local SVG placeholder (no external dependency)
  const getPlaceholderSVG = () => {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'400\' viewBox=\'0 0 300 400\'%3E%3Crect width=\'300\' height=\'400\' fill=\'%23f0e8e0\'/%3E%3Ctext x=\'50%25\' y=\'45%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Inter, sans-serif\' font-size=\'20\' fill=\'%235c0202\'%3E📚%3C/text%3E%3Ctext x=\'50%25\' y=\'55%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Inter, sans-serif\' font-size=\'16\' fill=\'%235c0202\'%3ENo Cover%3C/text%3E%3C/svg%3E';
  };

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images || imageError) return getPlaceholderSVG();
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        console.error('خطأ في تحليل الصور:', e);
        return getPlaceholderSVG();
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production-76f4.up.railway.app/storage/${images[0]}`;
    }
    
    return getPlaceholderSVG();
  };

  const handleImageError = () => {
    setImageError(true);
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
      <div className="book-card" data-rtl="true">
        <div className="book-cover">
          <img 
            src={getImageUrl(book.images)} 
            alt={book.titre || "غلاف الكتاب"} 
            onError={handleImageError}
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
          
          {/* Title with dynamic direction */}
          <h3 
            className="book-title"
            dir={getTextDirection(book.titre)}
            style={{ textAlign: getTextDirection(book.titre) === 'rtl' ? 'right' : 'left' }}
          >
            {book.titre || "عنوان غير معروف"}
          </h3>
          
          {/* Author with dynamic direction */}
          <p 
            className="book-author"
            dir={getTextDirection(book.auteur)}
            style={{ textAlign: getTextDirection(book.auteur) === 'rtl' ? 'right' : 'left' }}
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