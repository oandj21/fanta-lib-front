import { useState, useEffect, useRef } from "react";
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
  Clock
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

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'livre':
        return <BookOpen size={18} />;
      case 'commande':
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

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                >
                  <div 
                    className="notification-icon"
                    style={{ backgroundColor: `${getActionColor(notif.action)}15` }}
                  >
                    <span style={{ color: getActionColor(notif.action) }}>
                      {getNotificationIcon(notif.type)}
                    </span>
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      <span className="notification-action" style={{ color: getActionColor(notif.action) }}>
                        {notif.action === 'create' && 'Création'}
                        {notif.action === 'update' && 'Modification'}
                        {notif.action === 'delete' && 'Suppression'}
                        {notif.action === 'status_change' && 'Changement de statut'}
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
        </div>
      )}
    </div>
  );
}