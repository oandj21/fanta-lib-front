import { useState, useEffect } from "react";
import "../css/WhatsAppFloat.css";

const WHATSAPP_NUMBER = "212625854078";

export default function WhatsAppFloat() {
  const [cartCount, setCartCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for cart updates from within the same tab
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const getWhatsAppMessage = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
      return "مرحباً فانتازيا 📚، أود الحصول على معلومات حول كتبكم.";
    }

    // Map cart items with fallback values for missing data
    const items = cart.map((book, index) => {
      // Try all possible field names for title
      const title = book.titre || book.title || book.nom || `كتاب ${index + 1}`;
      
      // Try all possible field names for author
      const author = book.auteur || book.author || book.auteure || 'مؤلف غير معروف';
      
      // Try all possible field names for price
      
      return `- ${title} للكاتب ${author}`;
    }).join('\n');
    
    // Calculate total with fallback for missing prices
    const total = cart.reduce((sum, book) => {
      const price = book.prix_vente || book.prix || book.price || book.prix_achat || 0;
      return sum + Number(price);
    }, 0);
    
    const totalItems = cart.length;
    
    return `مرحباً فانتازيا 📚،

أود طلب الكتب التالية :

${items}

📦 المجموع : ${totalItems} كتب

يرجى تأكيد توفر الكتب وشروط التوصيل.
شكراً جزيلاً.`;
  };

  const handleClick = () => {
    // Get the message first
    const message = encodeURIComponent(getWhatsAppMessage());
    
    // Open WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    
    // Clear the cart after redirecting to WhatsApp
    localStorage.removeItem('cart');
    
    // Update cart count
    setCartCount(0);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="whatsapp-float"
      aria-label="اطلب عبر الواتساب"
    >
      <svg 
        className="whatsapp-icon" 
        viewBox="0 0 24 24" 
        width="30" 
        height="30"
      >
        <path d="M12.004 2.004C6.486 2.004 2 6.49 2 12.008c0 1.76.46 3.416 1.334 4.87L2.59 21.41l4.675-1.165c1.38.752 2.94 1.167 4.74 1.167 5.517 0 10.004-4.486 10.004-10.004S17.52 2.004 12.004 2.004zm0 18.338c-1.49 0-2.94-.39-4.215-1.123l-.302-.177-3.18.792.8-3.094-.187-.32a8.28 8.28 0 0 1-1.26-4.51c0-4.578 3.726-8.304 8.304-8.304s8.304 3.726 8.304 8.304-3.726 8.304-8.304 8.304zm4.47-6.207c-.245-.122-1.45-.716-1.674-.798-.225-.082-.388-.122-.55.122-.163.245-.634.798-.777.962-.143.164-.286.185-.53.062-.245-.123-1.032-.38-1.965-1.213-.726-.648-1.216-1.448-1.36-1.693-.143-.245-.015-.378.108-.5.108-.108.245-.286.368-.43.122-.143.163-.246.245-.41.082-.163.04-.307-.02-.43-.062-.123-.55-1.326-.755-1.814-.2-.48-.404-.407-.55-.407-.142 0-.307-.01-.473-.01-.164 0-.43.06-.655.286-.224.225-.86.84-.86 2.05s.88 2.384 1.003 2.55c.122.164 1.73 2.64 4.19 3.61.585.23 1.04.37 1.398.48.588.15 1.124.13 1.546.08.47-.06 1.45-.59 1.656-1.16.206-.57.206-1.06.145-1.16-.06-.102-.224-.163-.47-.285z"/>
      </svg>
      
      {cartCount > 0 && (
        <span className="whatsapp-badge">{cartCount}</span>
      )}
      
      <span className={`whatsapp-tooltip ${isHovered ? 'visible' : ''}`}>
        اطلب عبر الواتساب
      </span>
    </button>
  );
}