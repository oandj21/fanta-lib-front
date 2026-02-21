// Cart.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, BookOpen, Check } from "lucide-react";
import "../css/Cart.css";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const WHATSAPP_NUMBER = "212625854078";

  // Load cart from localStorage
  useEffect(() => {
    loadCart();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely parse price
  const parsePrice = (price) => {
    if (price === null || price === undefined) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Helper function to get image URL
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/300x400?text=No+Cover';
    
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `https://fanta-lib-back-production.up.railway.app/storage/${parsed[0]}`;
        }
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    
    if (Array.isArray(images) && images.length > 0) {
      return `https://fanta-lib-back-production.up.railway.app/storage/${images[0]}`;
    }
    
    return 'https://via.placeholder.com/300x400?text=No+Cover';
  };

  // Update quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    setRemovingId(id);
    
    setTimeout(() => {
      const updatedCart = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      setRemovingId(null);
      
      // Trigger storage event for header update
      window.dispatchEvent(new Event('storage'));
    }, 200);
  };

  // Remove item from cart
  const removeItem = (id) => {
    setRemovingId(id);
    
    setTimeout(() => {
      const updatedCart = cartItems.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      setRemovingId(null);
      
      // Trigger storage event for header update
      window.dispatchEvent(new Event('storage'));
    }, 300);
  };

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('Voulez-vous vraiment vider votre panier ?')) {
      localStorage.setItem('cart', JSON.stringify([]));
      setCartItems([]);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Calculate total items only (no prices)
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Generate WhatsApp message
  const getWhatsAppMessage = () => {
    if (cartItems.length === 0) {
      return "Bonjour Fantasia 📚, j'aimerais avoir des informations sur vos livres.";
    }

    const itemsList = cartItems.map(item => {
      const title = item.titre || item.title || "Livre";
      const author = item.auteur || item.author || "Auteur inconnu";
      const quantity = item.quantity || 1;
      return `• ${title} - ${author} (Quantité: ${quantity})`;
    }).join('\n');

    return `Bonjour Fantasia 📚,

Je souhaite commander les livres suivants :

${itemsList}

Informations de livraison :
Nom complet : 
Téléphone : 
Adresse complète : 
Ville : 

Merci de me confirmer la disponibilité et le prix total.`;
  };

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
    
    // Show success animation
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  if (loading) {
    return (
      <div className="cart-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement du panier...</p>
        </div>
        <WhatsAppFloat />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />

      <section className="page-hero">
        <div className="page-hero-content">
          <ShoppingCart size={48} />
          <h1>Mon Panier</h1>
        </div>
        <p>{totalItems} article{totalItems > 1 ? 's' : ''} dans votre panier</p>
      </section>

      <section className="cart-section">
        <div className="cart-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={80} />
              <h2>Votre panier est vide</h2>
              <p>Découvrez notre collection de livres et ajoutez vos coups de cœur</p>
              <Link to="/livres" className="btn-shop">
                <BookOpen size={20} />
                Découvrir les livres
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                <div className="cart-header">
                  <h2>Articles ({totalItems})</h2>
                  <button onClick={clearCart} className="btn-clear">
                    <Trash2 size={16} />
                    Vider le panier
                  </button>
                </div>

                {cartItems.map((item) => {
                  const quantity = item.quantity || 1;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`cart-item ${removingId === item.id ? 'removing' : ''}`}
                    >
                      <div className="item-image">
                        <img 
                          src={getImageUrl(item.images)} 
                          alt={item.titre || item.title || "Book"} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                          }}
                        />
                      </div>
                      
                      <div className="item-details">
                        <h3 className="item-title">{item.titre || item.title || "Titre inconnu"}</h3>
                        <p className="item-author">{item.auteur || item.author || "Auteur inconnu"}</p>
                      </div>

                      <div className="item-actions">
                        <div className="quantity-controls">
                          <button 
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                            className="quantity-btn"
                            disabled={quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="quantity">{quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, quantity + 1)}
                            className="quantity-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeItem(item.id)}
                          className="btn-remove"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary - Simplified */}
              <div className="cart-summary">
                <h2>Finaliser la commande</h2>
                
                <div className="summary-info">
                  <p className="summary-text">
                    Vous allez commander {totalItems} article{totalItems > 1 ? 's' : ''}.
                  </p>
                  <p className="summary-text">
                    Cliquez sur le bouton ci-dessous pour envoyer votre commande sur WhatsApp.
                  </p>
                </div>

                <button 
                  onClick={handleWhatsAppOrder}
                  className={`btn-checkout ${orderPlaced ? 'success' : ''}`}
                  disabled={orderPlaced}
                >
                  {orderPlaced ? (
                    <>
                      <Check size={20} />
                      Commande envoyée !
                    </>
                  ) : (
                    <>
                      <svg className="whatsapp-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M12.004 2.004C6.486 2.004 2 6.49 2 12.008c0 1.76.46 3.416 1.334 4.87L2.59 21.41l4.675-1.165c1.38.752 2.94 1.167 4.74 1.167 5.517 0 10.004-4.486 10.004-10.004S17.52 2.004 12.004 2.004zm0 18.338c-1.49 0-2.94-.39-4.215-1.123l-.302-.177-3.18.792.8-3.094-.187-.32a8.28 8.28 0 0 1-1.26-4.51c0-4.578 3.726-8.304 8.304-8.304s8.304 3.726 8.304 8.304-3.726 8.304-8.304 8.304zm4.47-6.207c-.245-.122-1.45-.716-1.674-.798-.225-.082-.388-.122-.55.122-.163.245-.634.798-.777.962-.143.164-.286.185-.53.062-.245-.123-1.032-.38-1.965-1.213-.726-.648-1.216-1.448-1.36-1.693-.143-.245-.015-.378.108-.5.108-.108.245-.286.368-.43.122-.143.163-.246.245-.41.082-.163.04-.307-.02-.43-.062-.123-.55-1.326-.755-1.814-.2-.48-.404-.407-.55-.407-.142 0-.307-.01-.473-.01-.164 0-.43.06-.655.286-.224.225-.86.84-.86 2.05s.88 2.384 1.003 2.55c.122.164 1.73 2.64 4.19 3.61.585.23 1.04.37 1.398.48.588.15 1.124.13 1.546.08.47-.06 1.45-.59 1.656-1.16.206-.57.206-1.06.145-1.16-.06-.102-.224-.163-.47-.285z"/>
                      </svg>
                      Commander sur WhatsApp
                    </>
                  )}
                </button>

                <p className="checkout-note">
                  Vous serez redirigé vers WhatsApp pour finaliser votre commande
                </p>

                <Link to="/livres" className="continue-shopping">
                  <ArrowLeft size={16} />
                  Continuer mes achats
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Similar Products Section */}
      {cartItems.length > 0 && (
        <section className="similar-section">
          <div className="section-header">
            <h2 className="section-title">Vous aimerez aussi</h2>
            <div className="section-divider"></div>
          </div>
          <div className="similar-placeholder">
            <p>Découvrez d'autres livres dans notre <Link to="/livres">catalogue</Link></p>
          </div>
        </section>
      )}

      <WhatsAppFloat />
    </div>
  );
}