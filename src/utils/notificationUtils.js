// Utility function to dispatch CRUD events for notifications
export const dispatchCrudEvent = (type, action, item, user = null) => {
  const event = new CustomEvent('crud-event', {
    detail: {
      type,
      action,
      item,
      user: user || getCurrentUser()
    }
  });
  window.dispatchEvent(event);
};

// Helper to get current user
const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('utilisateur');
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.name || parsed.email || 'Utilisateur';
    }
  } catch (e) {
    console.error('Error getting current user:', e);
  }
  return 'Système';
};

// Usage examples:
// After creating a book:
// dispatchCrudEvent('livre', 'create', { id: newBook.id, name: newBook.titre });

// After updating an order:
// dispatchCrudEvent('commande', 'update', { id: order.id, parcel_receiver: order.parcel_receiver });

// After deleting an expense:
// dispatchCrudEvent('depense', 'delete', { id: expenseId, name: expense.description });

// After status change:
// dispatchCrudEvent('commande', 'status_change', { 
//   id: order.id, 
//   old_status: 'NEW', 
//   new_status: 'DELIVERED' 
// });