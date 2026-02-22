import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

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

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const getWhatsAppMessage = () => {
    if (items.length === 0) return "Bonjour Fantasia, je souhaite commander des livres.";
    const lines = items.map(
      (i) => `• ${i.book.title} (${i.book.author}) x${i.quantity} — ${(i.book.price * i.quantity).toFixed(2)} DH`
    );
    const total = items.reduce((sum, i) => sum + i.book.price * i.quantity, 0);
    return `Bonjour Fantasia 📚\n\nJe souhaite commander :\n\n${lines.join("\n")}\n\n💰 Total : ${total.toFixed(2)} DH\n\nMerci !`;
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalCount, getWhatsAppMessage }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}