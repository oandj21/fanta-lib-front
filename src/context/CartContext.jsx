import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Charger depuis localStorage au démarrage
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  // Sync automatique avec localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Ajouter livre
  const addToCart = (book) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.book.id === book.id);

      if (existing) {
        return prev.map((i) =>
          i.book.id === book.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { book, quantity: 1 }];
    });
  };

  // Supprimer livre
  const removeFromCart = (bookId) => {
    setItems((prev) => prev.filter((i) => i.book.id !== bookId));
  };

  // Vider panier
  const clearCart = () => setItems([]);

  // Total quantité
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Total prix
  const totalPrice = items.reduce(
    (sum, i) =>
      sum + (Number(i.book.prix_achat) || 0) * i.quantity,
    0
  );

  // Message WhatsApp
  const getWhatsAppMessage = () => {
    if (items.length === 0) {
      return "Bonjour Fantasia 📚, je souhaite commander des livres.";
    }

    const lines = items.map((i) => {
      const price = Number(i.book.prix_achat) || 0;

      return `• ${i.book.titre} (${i.book.auteur || "Auteur inconnu"}) x${i.quantity} — ${(price * i.quantity).toFixed(2)} DH`;
    });

    return `Bonjour Fantasia 📚

Je souhaite commander les livres suivants :

${lines.join("\n")}

📦 Total : ${totalCount} livre(s)
💰 Montant total : ${totalPrice.toFixed(2)} DH

Merci de me confirmer la disponibilité et les modalités de livraison.`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        getWhatsAppMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
