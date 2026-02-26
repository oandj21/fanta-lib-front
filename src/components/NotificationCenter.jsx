import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Bell, 
  X, 
  Check, 
  BookOpen, 
  ShoppingCart, 
  Receipt, 
  TrendingUp, 
  Users, 
  Mail,
  User,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Trash2,
  CheckCheck,
  AlertCircle,
  Package,
  DollarSign,
  Clock,
  Filter,
  RefreshCw,
  Truck,
  MapPin,
  Phone,
  CreditCard,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../css/NotificationCenter.css";

export default function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClearAll,
  onDeleteNotification
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOnlyInProgress, setShowOnlyInProgress] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const notificationRef = useRef(null);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter notifications to show only in-progress orders
  const filteredNotifications = useMemo(() => {
    if (!showOnlyInProgress) return notifications;
    
    return notifications.filter(notif => {
      // Only filter commande type notifications
      if (notif.type !== 'commande') return false;
      
      // Check if the status is in progress
      const status = notif.status || '';
      const statusLower = status.toLowerCase();
      const details = notif.details?.toLowerCase() || '';
      const message = notif.message?.toLowerCase() || '';
      
      // Define in-progress statuses
      const inProgressKeywords = [
        'en cours', 'distribution', 'ramassé', 'expédié', 'attente',
        'nouveau', 'confirmé', 'programmé', 'reporté', 'voyage',
        'in_progress', 'picked_up', 'sent', 'waiting', 'new_parcel',
        'parcel_confirmed', 'programmer', 'postponed', 'envg',
        'deux', 'trois', '2ème', '3ème', 'refusé', 'noanswer',
        'pas de réponse', 'injoignable', 'hors zone', 'PICKED_UP',
        'DISTRIBUTION', 'IN_PROGRESS', 'SENT', 'WAITING_PICKUP',
        'NEW_PARCEL', 'PARCEL_CONFIRMED', 'PROGRAMMER', 'POSTPONED',
        'ENVG', 'DEUX', 'TROIS', 'REFUSE', 'NOANSWER', 'UNREACHABLE',
        'HORS_ZONE'
      ];
      
      // Final states to exclude
      const finalKeywords = [
        'livré', 'delivered', 'retourné', 'returned', 'annulé', 'cancelled',
        'DELIVERED', 'RETURNED', 'CANCELLED'
      ];
      
      const isInProgress = inProgressKeywords.some(keyword => 
        statusLower.includes(keyword.toLowerCase()) || 
        details.includes(keyword.toLowerCase()) || 
        message.includes(keyword.toLowerCase())
      );
      
      const isFinal = finalKeywords.some(keyword => 
        statusLower.includes(keyword.toLowerCase()) || 
        details.includes(keyword.toLowerCase()) || 
        message.includes(keyword.toLowerCase())
      );
      
      return isInProgress && !isFinal;
    });
  }, [notifications, showOnlyInProgress]);

  // Get icon based on notification type
  const getNotificationIcon = (type, action, status) => {
    switch(type) {
      case 'livre':
        return <BookOpen size={18} />;
      case 'commande':
        if (action === 'create') return <Package size={18} />;
        if (action === 'update') return <ShoppingCart size={18} />;
        if (action === 'status_change') return <RefreshCw size={18} />;
        
        // Status-based icons
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('distribution') || statusLower.includes('en cours')) {
          return <Truck size={18} />;
        }
        if (statusLower.includes('ramassé') || statusLower.includes('picked')) {
          return <Package size={18} />;
        }
        if (statusLower.includes('expédié') || statusLower.includes('sent')) {
          return <RefreshCw size={18} />;
        }
        if (statusLower.includes('attente') || statusLower.includes('waiting')) {
          return <Clock size={18} />;
        }
        if (statusLower.includes('refusé') || statusLower.includes('refuse')) {
          return <AlertCircle size={18} />;
        }
        return <ShoppingCart size={18} />;
      case 'depense':
        return <Receipt size={18} />;
      case 'finance':
        return <TrendingUp size={18} />;
      case 'utilisateur':
        return <Users size={18} />;
      case 'message':
        return <Mail size={18} />;
      case 'profile':
        return <User size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  // Get color based on action type and status
  const getActionColor = (action, status) => {
    if (action === 'status_change' || action === 'update') {
      const statusLower = (status || '').toLowerCase();
      if (statusLower.includes('distribution')) return '#f59e0b';
      if (statusLower.includes('ramassé')) return '#8b5cf6';
      if (statusLower.includes('expédié')) return '#0891b2';
      if (statusLower.includes('attente')) return '#f97316';
      if (statusLower.includes('refusé')) return '#ef4444';
      return '#3b82f6';
    }
    
    switch(action) {
      case 'create': return '#10b981';
      case 'update': return '#f59e0b';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower.includes('distribution')) return '#f59e0b';
    if (statusLower.includes('ramassé')) return '#8b5cf6';
    if (statusLower.includes('expédié')) return '#0891b2';
    if (statusLower.includes('attente')) return '#f97316';
    if (statusLower.includes('nouveau')) return '#3b82f6';
    if (statusLower.includes('confirmé')) return '#007bff';
    if (statusLower.includes('programmé')) return '#2563eb';
    if (statusLower.includes('reporté')) return '#8b5cf6';
    if (statusLower.includes('refusé')) return '#ef4444';
    if (statusLower.includes('pas de réponse')) return '#f59e0b';
    if (statusLower.includes('injoignable')) return '#d97706';
    if (statusLower.includes('hors zone')) return '#7c3aed';
    
    return '#6b7280';
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return notifTime.toLocaleDateString('fr-FR');
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  // Go to orders page
  const goToOrdersPage = () => {
    setIsOpen(false);
    navigate('/admin/orders');
  };

  return (
    <div className="notification-wrapper" ref={notificationRef}>
      <button 
        className={`notification-bell ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-header-actions">
              <div className="notification-filter">
                <button 
                  className={`filter-btn ${showOnlyInProgress ? 'active' : ''}`}
                  onClick={() => setShowOnlyInProgress(!showOnlyInProgress)}
                  title="Filtrer les commandes en cours"
                >
                  <Filter size={14} />
                  <span>En cours</span>
                </button>
              </div>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button onClick={onMarkAllAsRead} title="Tout marquer comme lu">
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={onClearAll} title="Tout effacer">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>Aucune notification</p>
                {notifications.length > 0 && showOnlyInProgress && (
                  <p className="empty-hint">
                    <Filter size={12} />
                    Filtre "En cours" activé
                  </p>
                )}
                {notifications.length === 0 && (
                  <p className="empty-sub">Les notifications apparaîtront ici</p>
                )}
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const statusColor = getStatusBadgeColor(notif.status);
                
                return (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.type === 'commande' ? 'order-notification' : ''}`}
                  >
                    <div 
                      className="notification-icon"
                      style={{ backgroundColor: `${getActionColor(notif.action, notif.status)}15` }}
                    >
                      <span style={{ color: getActionColor(notif.action, notif.status) }}>
                        {getNotificationIcon(notif.type, notif.action, notif.status)}
                      </span>
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-title">
                        <span className="notification-action" style={{ color: getActionColor(notif.action, notif.status) }}>
                          {notif.action === 'create' && '📦 Nouvelle commande'}
                          {notif.action === 'update' && '✏️ Mise à jour'}
                          {notif.action === 'delete' && '🗑️ Suppression'}
                          {notif.action === 'status_change' && '🔄 Changement de statut'}
                        </span>
                        <span className="notification-time">{formatTime(notif.timestamp)}</span>
                      </div>
                      
                      <p className="notification-message">{notif.message}</p>
                      
                      {/* Order Details */}
                      {notif.type === 'commande' && (
                        <div className="order-details">
                          {/* Status Badge */}
                          {notif.status && (
                            <div className="order-status-badge" style={{ 
                              backgroundColor: `${statusColor}15`,
                              color: statusColor,
                              border: `1px solid ${statusColor}30`
                            }}>
                              {notif.status}
                              {notif.secondaryStatus && notif.secondaryStatus !== '' && (
                                <span className="secondary-status"> - {notif.secondaryStatus}</span>
                              )}
                            </div>
                          )}
                          
                          {/* Client Info */}
                          {notif.clientName && (
                            <div className="order-client-info">
                              <User size={12} />
                              <span>{notif.clientName}</span>
                              {notif.clientPhone && (
                                <span className="client-phone">
                                  <Phone size={10} />
                                  {notif.clientPhone}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* City & Price */}
                          {(notif.city || notif.parcelPrice) && (
                            <div className="order-meta">
                              {notif.city && (
                                <span className="order-city">
                                  <MapPin size={12} />
                                  {notif.city}
                                </span>
                              )}
                              {notif.parcelPrice && (
                                <span className="order-price">
                                  <CreditCard size={12} />
                                  {notif.parcelPrice} MAD
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Additional Details */}
                      {notif.details && notif.type !== 'commande' && (
                        <div className="notification-details">
                          <ChevronRight size={12} />
                          <span>{notif.details}</span>
                        </div>
                      )}
                    </div>

                    <div className="notification-item-actions">
                      {/* View Details Button for Orders */}
                      {notif.type === 'commande' && notif.parcelCode && (
                        <button 
                          onClick={() => handleViewOrder(notif)}
                          className="view-order-btn"
                          title="Voir les détails"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      
                      {!notif.read && (
                        <button 
                          onClick={() => onMarkAsRead(notif.id)}
                          className="mark-read"
                          title="Marquer comme lu"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteNotification(notif.id)}
                        className="delete-notification"
                        title="Supprimer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {filteredNotifications.length > 0 && (
            <div className="notification-footer">
              <div className="footer-left">
                <span className="notification-count">
                  {filteredNotifications.length} commande{filteredNotifications.length > 1 ? 's' : ''} en cours
                </span>
              </div>
              <button 
                className="view-all-orders-btn"
                onClick={goToOrdersPage}
              >
                Voir toutes les commandes
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="order-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de la commande</h3>
              <button onClick={closeDetailsModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Order Code */}
              <div className="detail-section">
                <div className="detail-label">Code colis</div>
                <div className="detail-value code">{selectedOrder.parcelCode}</div>
              </div>

              {/* Status */}
              {selectedOrder.status && (
                <div className="detail-section">
                  <div className="detail-label">Statut</div>
                  <div className="detail-value">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: `${getStatusBadgeColor(selectedOrder.status)}15`,
                        color: getStatusBadgeColor(selectedOrder.status),
                        border: `1px solid ${getStatusBadgeColor(selectedOrder.status)}30`
                      }}
                    >
                      {selectedOrder.status}
                      {selectedOrder.secondaryStatus && (
                        <span className="secondary-status"> - {selectedOrder.secondaryStatus}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Client Info */}
              {selectedOrder.clientName && (
                <div className="detail-section">
                  <div className="detail-label">Client</div>
                  <div className="detail-value">{selectedOrder.clientName}</div>
                </div>
              )}

              {/* Phone */}
              {selectedOrder.clientPhone && (
                <div className="detail-section">
                  <div className="detail-label">Téléphone</div>
                  <div className="detail-value">{selectedOrder.clientPhone}</div>
                </div>
              )}

              {/* City */}
              {selectedOrder.city && (
                <div className="detail-section">
                  <div className="detail-label">Ville</div>
                  <div className="detail-value">{selectedOrder.city}</div>
                </div>
              )}

              {/* Address */}
              {selectedOrder.address && (
                <div className="detail-section">
                  <div className="detail-label">Adresse</div>
                  <div className="detail-value">{selectedOrder.address}</div>
                </div>
              )}

              {/* Price */}
              {selectedOrder.parcelPrice && (
                <div className="detail-section">
                  <div className="detail-label">Prix</div>
                  <div className="detail-value price">{selectedOrder.parcelPrice} MAD</div>
                </div>
              )}

              {/* Quantity */}
              {selectedOrder.quantity && (
                <div className="detail-section">
                  <div className="detail-label">Quantité</div>
                  <div className="detail-value">{selectedOrder.quantity}</div>
                </div>
              )}

              {/* Message */}
              {selectedOrder.message && (
                <div className="detail-section">
                  <div className="detail-label">Message</div>
                  <div className="detail-value">{selectedOrder.message}</div>
                </div>
              )}

              {/* Details */}
              {selectedOrder.details && (
                <div className="detail-section">
                  <div className="detail-label">Détails</div>
                  <div className="detail-value">{selectedOrder.details}</div>
                </div>
              )}

              {/* Timestamp */}
              {selectedOrder.timestamp && (
                <div className="detail-section">
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{new Date(selectedOrder.timestamp).toLocaleString('fr-FR')}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closeDetailsModal} className="btn-secondary">
                Fermer
              </button>
              <button 
                onClick={() => {
                  closeDetailsModal();
                  goToOrdersPage();
                }} 
                className="btn-primary"
              >
                Gérer les commandes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}