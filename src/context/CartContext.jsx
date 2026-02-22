import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load cart from localStorage on initial mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (book) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.book.id === book.id);
      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId) => {
    setItems((prev) => prev.filter((i) => i.book.id !== bookId));
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.book.id === bookId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.book.prix || i.book.price || 0) * i.quantity, 0);

  const getWhatsAppMessage = () => {
    if (items.length === 0) {
      return "Bonjour Fantasia, je souhaite commander des livres.";
    }
    
    const lines = items.map((i) => {
      const title = i.book.titre || i.book.title || "Titre inconnu";
      const author = i.book.auteur || i.book.author || "Auteur inconnu";
      const price = i.book.prix || i.book.price || 0;
      return `• ${title} (${author}) x${i.quantity} — ${(price * i.quantity).toFixed(2)} DH`;
    });
    
    return `Bonjour Fantasia 📚\n\nJe souhaite commander :\n\n${lines.join("\n")}\n\n💰 Total : ${totalPrice.toFixed(2)} DH\n\nMerci de me confirmer la disponibilité et les modalités de livraison.`;
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart, 
      totalCount, 
      totalPrice,
      getWhatsAppMessage 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}