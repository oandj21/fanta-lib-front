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
  Filter
} from "lucide-react";
import "../css/NotificationCenter.css";

export default function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClearAll,
  onDeleteNotification
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOnlyInProgress, setShowOnlyInProgress] = useState(true);
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
        'pas de réponse', 'injoignable', 'hors zone'
      ];
      
      // Final states to exclude
      const finalKeywords = [
        'livré', 'delivered', 'retourné', 'returned', 'annulé', 'cancelled'
      ];
      
      const isInProgress = inProgressKeywords.some(keyword => 
        statusLower.includes(keyword) || 
        details.includes(keyword) || 
        message.includes(keyword)
      );
      
      const isFinal = finalKeywords.some(keyword => 
        statusLower.includes(keyword) || 
        details.includes(keyword) || 
        message.includes(keyword)
      );
      
      return isInProgress && !isFinal;
    });
  }, [notifications, showOnlyInProgress]);

  // Get icon based on notification type
  const getNotificationIcon = (type, action) => {
    switch(type) {
      case 'livre':
        return <BookOpen size={18} />;
      case 'commande':
        if (action === 'create') return <Package size={18} />;
        if (action === 'update') return <ShoppingCart size={18} />;
        if (action === 'status_change') return <RefreshCw size={18} />;
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

  // Get color based on action type
  const getActionColor = (action) => {
    switch(action) {
      case 'create': return '#10b981';
      case 'update': return '#f59e0b';
      case 'delete': return '#ef4444';
      case 'status_change': return '#3b82f6';
      default: return '#6b7280';
    }
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
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                >
                  <div 
                    className="notification-icon"
                    style={{ backgroundColor: `${getActionColor(notif.action)}15` }}
                  >
                    <span style={{ color: getActionColor(notif.action) }}>
                      {getNotificationIcon(notif.type, notif.action)}
                    </span>
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      <span className="notification-action" style={{ color: getActionColor(notif.action) }}>
                        {notif.action === 'create' && '📦 Nouvelle commande'}
                        {notif.action === 'update' && '✏️ Mise à jour'}
                        {notif.action === 'delete' && '🗑️ Suppression'}
                        {notif.action === 'status_change' && '🔄 Changement de statut'}
                      </span>
                      <span className="notification-time">{formatTime(notif.timestamp)}</span>
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    {notif.details && (
                      <div className="notification-details">
                        <ChevronRight size={12} />
                        <span>{notif.details}</span>
                      </div>
                    )}
                    {notif.clientName && (
                      <div className="notification-client">
                        <User size={10} />
                        <span>{notif.clientName}</span>
                      </div>
                    )}
                  </div>

                  <div className="notification-item-actions">
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
              ))
            )}
          </div>
          
          {filteredNotifications.length > 0 && (
            <div className="notification-footer">
              <span className="notification-count">
                {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
                {showOnlyInProgress && ' (en cours)'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}