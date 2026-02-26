// src/utils/orderNotificationUtils.js

// Utility function to dispatch CRUD events for notifications
export const dispatchCrudEvent = (type, action, item, user = null) => {
  // For commandes, we want to check the status
  if (type === 'commande') {
    const status = item.statut || item.status || item.deliveryStatus || '';
    const statusLower = status.toLowerCase();
    
    // Define in-progress statuses (all statuses except final states)
    const inProgressStatuses = [
      'in_progress', 'en cours', 'distribution', 'picked_up', 
      'ramassé', 'sent', 'expédié', 'waiting_pickup', 'en attente',
      'deux', '2ème', 'trois', '3ème', 'programmer', 'programmé',
      'envg', 'en voyage', 'postponed', 'reporté', 'new_parcel', 
      'nouveau', 'parcel_confirmed', 'confirmé', 'picked_up', 'ramassé',
      'refuse', 'refusé', 'noanswer', 'pas de réponse', 'unreachable',
      'injoignable', 'hors_zone', 'hors zone'
    ];
    
    // Final states that should NOT trigger notifications
    const finalStatuses = [
      'delivered', 'livré', 'returned', 'retourné', 
      'cancelled', 'annulé', 'return_by_amana', 'retour amana'
    ];
    
    // Check if current status is in progress (not a final state)
    const isInProgress = inProgressStatuses.some(s => statusLower.includes(s)) && 
                        !finalStatuses.some(s => statusLower.includes(s));
    
    if (!isInProgress) {
      console.log('Skipping notification for non-in-progress order:', status);
      return; // Don't dispatch for non-in-progress orders
    }
  }
  
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

// Specific utility for order notifications
export const dispatchOrderNotification = (action, order, user = null) => {
  const status = order.statut || order.status || order.deliveryStatus || '';
  const statusLower = status.toLowerCase();
  
  // Define in-progress statuses (all statuses except final states)
  const inProgressStatuses = [
    'in_progress', 'en cours', 'distribution', 'picked_up', 
    'ramassé', 'sent', 'expédié', 'waiting_pickup', 'en attente',
    'deux', '2ème', 'trois', '3ème', 'programmer', 'programmé',
    'envg', 'en voyage', 'postponed', 'reporté', 'new_parcel', 
    'nouveau', 'parcel_confirmed', 'confirmé', 'picked_up', 'ramassé',
    'refuse', 'refusé', 'noanswer', 'pas de réponse', 'unreachable',
    'injoignable', 'hors_zone', 'hors zone'
  ];
  
  // Final states that should NOT trigger notifications
  const finalStatuses = [
    'delivered', 'livré', 'returned', 'retourné', 
    'cancelled', 'annulé', 'return_by_amana', 'retour amana'
  ];
  
  // Check if current status is in progress (not a final state)
  const isInProgress = inProgressStatuses.some(s => statusLower.includes(s)) && 
                      !finalStatuses.some(s => statusLower.includes(s));
  
  if (!isInProgress) {
    console.log('Order not in progress, skipping notification:', status);
    return; // Don't dispatch for non-in-progress orders
  }
  
  const event = new CustomEvent('crud-event', {
    detail: {
      type: 'commande',
      action,
      item: {
        ...order,
        // Ensure status is properly passed
        statut: order.statut || order.status || order.deliveryStatus
      },
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
// After creating an order:
// dispatchOrderNotification('create', newOrder);

// After updating an order:
// dispatchOrderNotification('update', updatedOrder);

// After status change:
// dispatchOrderNotification('status_change', {
//   id: order.id,
//   parcel_receiver: order.parcel_receiver,
//   old_status: 'NEW',
//   new_status: 'IN_PROGRESS',
//   statut: 'IN_PROGRESS'
// });