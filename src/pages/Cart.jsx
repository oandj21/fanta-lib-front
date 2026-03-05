// Cart.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import WhatsAppFloat from "./WhatsAppFloat";
import "../css/Cart.css";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'all'
  const navigate = useNavigate();

  // Load cart from localStorage
  useEffect(() => {
    loadCart();
  }, []);

  // Load cart data and group by ISBN
  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    
    // Group items by ISBN
    const grouped = groupItemsByISBN(cart);
    setGroupedItems(grouped);
    
    // Calculate totals
    calculateTotals(cart);
  };

  // Group items by ISBN
  const groupItemsByISBN = (items) => {
    const groups = [];
    const processedIds = new Set();

    items.forEach(item => {
      if (processedIds.has(item.id)) return;

      // Find all items with same ISBN
      const sameISBNItems = items.filter(i => 
        i.isbn && i.isbn.toString().trim() === item.isbn?.toString().trim()
      );

      if (sameISBNItems.length > 1) {
        // Group items with same ISBN
        groups.push({
          id: `group-${item.isbn}`,
          isbn: item.isbn,
          items: sameISBNItems,
          totalQuantity: sameISBNItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
          isGroup: true
        });
        
        // Mark all items in this group as processed
        sameISBNItems.forEach(i => processedIds.add(i.id));
      } else {
        // Single item without matching ISBN
        groups.push({
          id: item.id,
          ...item,
          isGroup: false
        });
        processedIds.add(item.id);
      }
    });

    return groups;
  };

  // Calculate totals
  const calculateTotals = (items) => {
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.prix_achat) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
    setTotalPrice(total);

    const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setTotalItems(count);
  };

  // Update cart in localStorage and state
  const updateCart = (newCart) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    setCartItems(newCart);
    
    // Regroup items
    const grouped = groupItemsByISBN(newCart);
    setGroupedItems(grouped);
    
    // Recalculate totals
    calculateTotals(newCart);
    
    // Dispatch events to update other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Update quantity for a specific item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    updateCart(updatedCart);
  };

  // Handle delete with ISBN grouping
  const handleDelete = (item) => {
    if (item.isGroup) {
      // For grouped items, show confirmation with options
      setShowDeleteConfirm(item);
    } else {
      // For single item, delete just that item
      deleteSingleItem(item.id);
    }
  };

  // Delete a single item
  const deleteSingleItem = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    updateCart(updatedCart);
    setShowDeleteConfirm(null);
  };

  // Delete all items with the same ISBN
  const deleteAllByISBN = (isbn) => {
    const updatedCart = cartItems.filter(item => 
      !item.isbn || item.isbn.toString().trim() !== isbn.toString().trim()
    );
    updateCart(updatedCart);
    setShowDeleteConfirm(null);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (!showDeleteConfirm) return;

    if (deleteMode === 'all' && showDeleteConfirm.isbn) {
      deleteAllByISBN(showDeleteConfirm.isbn);
    } else if (deleteMode === 'single' && showDeleteConfirm.isGroup) {
      // When deleting a single item from a group, we need to find which one to delete
      // This will be handled by the UI that shows individual items
    }
  };

  // Delete a specific item from a group
  const deleteItemFromGroup = (itemId) => {
    deleteSingleItem(itemId);
    setShowDeleteConfirm(null);
  };

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع الكتب من السلة؟')) {
      updateCart([]);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Format price
  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return numPrice.toFixed(2);
  };

  // Get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/80x120?text=No+Cover';
    
    if (typeof images === 'string') {
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
    
    return 'https://via.placeholder.com/80x120?text=No+Cover';
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <Header />
        <div className="empty-cart">
          <div className="empty-cart-content">
            <ShoppingCart size={64} />
            <h2>سلتك فارغة</h2>
            <p>لم تقم بإضافة أي كتب إلى السلة بعد</p>
            <Link to="/livres" className="browse-books-btn">
              تصفح الكتب
            </Link>
          </div>
        </div>
        <WhatsAppFloat />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />
      
      <div className="cart-container">
        <div className="cart-header">
          <h1>
            <ShoppingCart size={24} />
            سلة التسوق
          </h1>
          <button onClick={clearCart} className="clear-cart-btn">
            <Trash2 size={18} />
            تفريغ السلة
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {groupedItems.map((group) => (
              <div key={group.id} className={`cart-item-group ${group.isGroup ? 'has-group' : ''}`}>
                {group.isGroup ? (
                  // Grouped items with same ISBN
                  <>
                    <div className="group-header">
                      <div className="group-isbn">
                        <BookOpen size={16} />
                        <span>ISBN: {group.isbn}</span>
                        <span className="group-badge">
                          {group.items.length} إصدارات
                        </span>
                      </div>
                      <div className="group-actions">
                        <button
                          onClick={() => setShowDeleteConfirm(group)}
                          className="delete-group-btn"
                          title="حذف جميع الإصدارات"
                        >
                          <Trash2 size={16} />
                          <span>حذف الكل</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="group-items">
                      {group.items.map((item) => (
                        <div key={item.id} className="cart-item">
                          <div className="item-image">
                            <img 
                              src={getImageUrl(item.images)} 
                              alt={item.titre}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/80x120?text=Error";
                              }}
                            />
                          </div>
                          
                          <div className="item-details">
                            <h3 className="item-title">{item.titre || "عنوان غير معروف"}</h3>
                            <p className="item-author">{item.auteur || "مؤلف غير معروف"}</p>
                            {item.categorie && (
                              <span className="item-category">{item.categorie}</span>
                            )}
                          </div>
                          
                          <div className="item-price">
                            {formatPrice(item.prix_achat)} درهم
                          </div>
                          
                          <div className="item-quantity">
                            <button
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                              disabled={(item.quantity || 1) <= 1}
                              className="quantity-btn"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="quantity-value">{item.quantity || 1}</span>
                            <button
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                              className="quantity-btn"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => deleteItemFromGroup(item.id)}
                            className="delete-item-btn"
                            title="حذف هذا الإصدار"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="group-total">
                      <span>إجمالي الإصدارات:</span>
                      <strong>
                        {formatPrice(group.items.reduce((sum, item) => 
                          sum + (parseFloat(item.prix_achat) || 0) * (item.quantity || 1), 0
                        ))} درهم
                      </strong>
                    </div>
                  </>
                ) : (
                  // Single item without ISBN match
                  <div className="cart-item">
                    <div className="item-image">
                      <img 
                        src={getImageUrl(group.images)} 
                        alt={group.titre}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/80x120?text=Error";
                        }}
                      />
                    </div>
                    
                    <div className="item-details">
                      <h3 className="item-title">{group.titre || "عنوان غير معروف"}</h3>
                      <p className="item-author">{group.auteur || "مؤلف غير معروف"}</p>
                      {group.categorie && (
                        <span className="item-category">{group.categorie}</span>
                      )}
                    </div>
                    
                    <div className="item-price">
                      {formatPrice(group.prix_achat)} درهم
                    </div>
                    
                    <div className="item-quantity">
                      <button
                        onClick={() => updateQuantity(group.id, (group.quantity || 1) - 1)}
                        disabled={(group.quantity || 1) <= 1}
                        className="quantity-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity-value">{group.quantity || 1}</span>
                      <button
                        onClick={() => updateQuantity(group.id, (group.quantity || 1) + 1)}
                        className="quantity-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(group)}
                      className="delete-item-btn"
                      title="حذف من السلة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>ملخص الطلب</h2>
            
            <div className="summary-row">
              <span>عدد الكتب:</span>
              <strong>{totalItems}</strong>
            </div>
            
            <div className="summary-row">
              <span>المجموع:</span>
              <strong className="total-price">{formatPrice(totalPrice)} درهم</strong>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="checkout-btn"
              disabled={cartItems.length === 0}
            >
              متابعة الطلب
            </button>
            
            <Link to="/livres" className="continue-shopping">
              <ArrowLeft size={16} />
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <AlertCircle size={40} className="confirm-icon" />
            
            <h3>تأكيد الحذف</h3>
            
            {showDeleteConfirm.isGroup ? (
              <>
                <p className="confirm-message">
                  هذا الكتاب له {showDeleteConfirm.items.length} إصدارات بنفس الرقم التسلسلي (ISBN)
                </p>
                
                <div className="delete-options">
                  <label className="delete-option">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="single"
                      checked={deleteMode === 'single'}
                      onChange={() => setDeleteMode('single')}
                    />
                    <div className="option-content">
                      <strong>حذف إصدار واحد فقط</strong>
                      <span>سيتم حذف الإصدار المحدد فقط</span>
                    </div>
                  </label>
                  
                  <label className="delete-option">
                    <input
                      type="radio"
                      name="deleteMode"
                      value="all"
                      checked={deleteMode === 'all'}
                      onChange={() => setDeleteMode('all')}
                    />
                    <div className="option-content">
                      <strong>حذف جميع الإصدارات</strong>
                      <span>سيتم حذف جميع الكتب التي لها نفس ISBN</span>
                    </div>
                  </label>
                </div>
              </>
            ) : (
              <p className="confirm-message">
                هل أنت متأكد من حذف هذا الكتاب من السلة؟
              </p>
            )}
            
            <div className="confirm-actions">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="cancel-btn"
              >
                إلغاء
              </button>
              
              <button
                onClick={() => {
                  if (showDeleteConfirm.isGroup) {
                    if (deleteMode === 'all') {
                      deleteAllByISBN(showDeleteConfirm.isbn);
                    } else {
                      setShowDeleteConfirm(null);
                      // For single delete, user needs to click the individual item's delete button
                    }
                  } else {
                    deleteSingleItem(showDeleteConfirm.id);
                  }
                }}
                className="confirm-btn"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppFloat />
    </div>
  );
}