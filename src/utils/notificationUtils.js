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
  console.log('✅ Dispatched crud-event:', { type, action, item });
};

// Specific utility for order notifications
export const dispatchOrderNotification = (action, order, user = null) => {
  dispatchCrudEvent('commande', action, order, user);
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