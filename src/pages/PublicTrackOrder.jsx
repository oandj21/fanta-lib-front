import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Home,
  Info,
  AlertCircle,
  CheckCircle,
  History,
  XCircle,
  PackageX,
  PackageCheck,
  MapPinOff,
  PhoneOff,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  RefreshCw as RefreshIcon,
  TrendingUp,
  DollarSign
} from "lucide-react";

import "../css/PublicTrackOrder.css";

// Complete French translations for all statuses
const statusTranslations = {
  // Primary delivery statuses
  'NEW_PARCEL': 'Nouveau colis',
  'PARCEL_CONFIRMED': 'Colis confirmé',
  'PICKED_UP': 'Ramassé',
  'DISTRIBUTION': 'En distribution',
  'IN_PROGRESS': 'En cours',
  'SENT': 'Expédié',
  'DELIVERED': 'Livré',
  'RETURNED': 'Retourné',
  'WAITING_PICKUP': 'En attente de ramassage',
  'RECEIVED': 'Reçu',
  'CANCELLED': 'Annulé',
  'CANCELED': 'Annulé',
  
  // Secondary statuses
  'REFUSE': 'Refusé',
  'NOANSWER': 'Pas de réponse',
  'UNREACHABLE': 'Injoignable',
  'HORS_ZONE': 'Hors zone',
  'POSTPONED': 'Reporté',
  'PROGRAMMER': 'Programmé',
  'DEUX': '2ème tentative',
  'TROIS': '3ème tentative',
  'ENVG': 'En voyage',
  'RETURN_BY_AMANA': 'Retour Amana',
  'SENT_BY_AMANA': 'Envoyé Amana',
  
  // Payment statuses
  'PAID': 'Payé',
  'NOT_PAID': 'Non payé',
  'INVOICED': 'Facturé',
  'PENDING': 'En attente'
};

// Helper to translate status to French
const translateStatus = (status) => {
  if (!status) return '';
  
  // Check exact match
  if (statusTranslations[status]) {
    return statusTranslations[status];
  }
  
  // Check case-insensitive match
  const statusUpper = status.toUpperCase();
  if (statusTranslations[statusUpper]) {
    return statusTranslations[statusUpper];
  }
  
  // Return original if no translation found
  return status;
};

// Helper to get status color
const getStatusColor = (status) => {
  if (!status) return "#6b7280";

  const s = status.toLowerCase();

  // Primary delivery statuses
  if (s.includes("livré") || s.includes("delivered")) return "#22c55e";
  if (s.includes("distribution")) return "#f59e0b";
  if (s.includes("ramassé") || s.includes("ramass") || s.includes("picked")) return "#8b5cf6";
  if (s.includes("attente") || s.includes("waiting")) return "#6b7280";
  if (s.includes("retour") || s.includes("return")) return "#ef4444";
  if (s.includes("en cours") || s.includes("in_progress")) return "#007bff";
  if (s.includes("expédié") || s.includes("sent")) return "#0891b2";
  if (s.includes("nouveau") || s.includes("new_parcel")) return "#3b82f6";
  if (s.includes("reçu") || s.includes("received")) return "#10b981";
  if (s.includes("confirmé") || s.includes("parcel_confirmed")) return "#8b5cf6";
  if (s.includes("annulé") || s.includes("cancelled")) return "#6b7280";
  
  // Secondary statuses
  if (s.includes("refusé") || s.includes("refuse")) return "#dc2626";
  if (s.includes("pas de réponse") || s.includes("noanswer")) return "#f59e0b";
  if (s.includes("injoignable") || s.includes("unreachable")) return "#d97706";
  if (s.includes("hors zone") || s.includes("hors_zone")) return "#7c3aed";
  if (s.includes("reporté") || s.includes("postponed")) return "#8b5cf6";
  if (s.includes("programmé") || s.includes("programmer")) return "#2563eb";
  if (s.includes("2ème") || s.includes("deux")) return "#f97316";
  if (s.includes("3ème") || s.includes("trois")) return "#ea580c";
  if (s.includes("en voyage") || s.includes("envg")) return "#0891b2";
  if (s.includes("retour amana") || s.includes("return_by_amana")) return "#b91c1c";
  if (s.includes("envoyé amana") || s.includes("sent_by_amana")) return "#1e40af";
  
  // Payment statuses
  if (s.includes("payé") || s.includes("paid")) return "#10b981";
  if (s.includes("non payé") || s.includes("not_paid")) return "#ef4444";
  if (s.includes("facturé") || s.includes("invoiced")) return "#8b5cf6";
  if (s.includes("en attente") || s.includes("pending")) return "#6b7280";

  return "#3b82f6";
};

// Get icon for status
const getStatusIcon = (status) => {
  if (!status) return Package;
  
  const s = status.toLowerCase();
  
  if (s.includes("livré") || s.includes("delivered")) return PackageCheck;
  if (s.includes("distribution")) return Truck;
  if (s.includes("ramassé") || s.includes("picked")) return Package;
  if (s.includes("retour") || s.includes("return")) return PackageX;
  if (s.includes("annulé") || s.includes("cancelled")) return XCircle;
  if (s.includes("refusé") || s.includes("refuse")) return XCircle;
  if (s.includes("pas de réponse") || s.includes("noanswer")) return PhoneOff;
  if (s.includes("injoignable") || s.includes("unreachable")) return PhoneOff;
  if (s.includes("hors zone") || s.includes("hors_zone")) return MapPinOff;
  if (s.includes("reporté") || s.includes("postponed")) return ClockIcon;
  if (s.includes("programmé") || s.includes("programmer")) return CalendarIcon;
  if (s.includes("2ème") || s.includes("deux")) return RefreshIcon;
  if (s.includes("3ème") || s.includes("trois")) return RefreshIcon;
  if (s.includes("en voyage") || s.includes("envg")) return Truck;
  if (s.includes("en attente") || s.includes("waiting")) return Clock;
  if (s.includes("en cours") || s.includes("in_progress")) return TrendingUp;
  
  return Package;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

// Define the complete order of statuses for timeline
const statusOrder = [
  'CREATED',
  'NEW_PARCEL',
  'PARCEL_CONFIRMED',
  'WAITING_PICKUP',
  'PICKED_UP',
  'RECEIVED',
  'SENT',
  'IN_PROGRESS',
  'DISTRIBUTION',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
  'CANCELED'
];

// Helper to extract base status (remove secondary)
const getBaseStatus = (fullStatus) => {
  if (!fullStatus) return '';
  // If status has secondary (contains " - "), take the first part
  if (fullStatus.includes(' - ')) {
    return fullStatus.split(' - ')[0];
  }
  return fullStatus;
};

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();
  const [activeTab, setActiveTab] = useState('suivi');
  const [showWelcome, setShowWelcome] = useState(true);

  const [trackingInfo, setTrackingInfo] = useState(null);
  const [order, setOrder] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = "https://fanta-lib-back-production-76f4.up.railway.app/api";

  useEffect(() => {
    if (parcelCode) {
      fetchOrderWithHistory();
    }
  }, [parcelCode]);

  // Auto-hide welcome message after 3 seconds
  useEffect(() => {
    if (!loading && order) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  /* Generate timeline from status history */
  const generateTimelineFromHistory = (history, currentStatus, currentSecondary) => {
    if (!history || history.length === 0) {
      // Fallback: generate from current status only
      return generateAllStatuses(currentStatus, currentSecondary, []);
    }

    // Process history to create unique status entries with timestamps
    const statusMap = new Map();
    
    // Add creation entry if not in history
    if (history.length > 0 && history[0].old_status === null) {
      statusMap.set('CREATED', {
        status: 'CREATED',
        date: history[0].changed_at,
        completed: true
      });
    }
    
    // Process each history entry
    history.forEach(entry => {
      // Add old status if it exists and not null
      if (entry.old_status && entry.old_status !== 'null' && entry.old_status !== '') {
        const baseOld = getBaseStatus(entry.old_status);
        if (!statusMap.has(baseOld) && baseOld !== '') {
          statusMap.set(baseOld, {
            status: baseOld,
            date: entry.changed_at,
            completed: true
          });
        }
      }
      
      // Add new status
      if (entry.new_status && entry.new_status !== 'null' && entry.new_status !== '') {
        const baseNew = getBaseStatus(entry.new_status);
        if (!statusMap.has(baseNew)) {
          statusMap.set(baseNew, {
            status: baseNew,
            date: entry.changed_at,
            completed: true
          });
        } else if (statusMap.get(baseNew).date < entry.changed_at) {
          // Update with latest date if multiple entries
          statusMap.set(baseNew, {
            status: baseNew,
            date: entry.changed_at,
            completed: true
          });
        }
      }
    });
    
    // Add current status
    const currentBase = getBaseStatus(currentStatus);
    if (currentBase && !statusMap.has(currentBase)) {
      statusMap.set(currentBase, {
        status: currentBase,
        date: new Date().toISOString(),
        completed: false,
        isCurrent: true
      });
    } else if (currentBase && statusMap.has(currentBase)) {
      const existing = statusMap.get(currentBase);
      existing.isCurrent = true;
      existing.completed = false;
      statusMap.set(currentBase, existing);
    }
    
    // Generate timeline in correct order
    const timeline = [];
    statusOrder.forEach(statusKey => {
      const statusData = statusMap.get(statusKey);
      if (statusData) {
        timeline.push({
          key: statusKey,
          label: translateStatus(statusKey),
          isCompleted: statusData.completed || false,
          isCurrent: statusData.isCurrent || false,
          date: statusData.date,
          color: getStatusColor(statusKey),
          hasSecondary: currentSecondary && statusKey === currentBase && statusData.isCurrent
        });
      }
    });
    
    return timeline;
  };

  /* Generate all possible statuses for the timeline (fallback) */
  const generateAllStatuses = (currentDeliveryStatus, secondaryStatus, history = []) => {
    const statuses = [];
    
    statusOrder.forEach(statusKey => {
      const translatedStatus = translateStatus(statusKey);
      if (!translatedStatus) return;
      
      const historyItem = history.find(item => 
        item.status?.toUpperCase() === statusKey || 
        translateStatus(item.status) === translatedStatus
      );
      
      const isCurrentDeliveryStatus = 
        currentDeliveryStatus?.toUpperCase() === statusKey || 
        translateStatus(currentDeliveryStatus) === translatedStatus;
      
      let isCompleted = false;
      let statusDate = null;
      
      if (historyItem) {
        isCompleted = true;
        statusDate = historyItem.date;
      } else if (isCurrentDeliveryStatus) {
        isCompleted = false;
      }
      
      statuses.push({
        key: statusKey,
        label: translatedStatus,
        isCompleted,
        isCurrent: isCurrentDeliveryStatus,
        date: statusDate,
        color: getStatusColor(statusKey)
      });
    });
    
    return statuses;
  };

  /* Fetch order with status history from backend */
  const fetchOrderWithHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      // Fetch order details with status history
      const orderRes = await axios.get(
        `${API_URL}/public/order/${parcelCode}`
      );

      if (orderRes.data && !orderRes.data.error) {
        const orderData = orderRes.data;
        setOrder(orderData);
        
        // Get status history from order data
        const history = orderData.status_history || [];
        setStatusHistory(history);
        
        // Generate timeline from history
        const timeline = generateTimelineFromHistory(
          history, 
          orderData.statut, 
          orderData.statut_second
        );
        setAllStatuses(timeline);
      } else {
        // Fallback to tracking API if order endpoint fails
        await fetchTracking(isRefresh);
      }
    } catch (err) {
      console.error("Error fetching order with history:", err);
      // Fallback to tracking API
      await fetchTracking(isRefresh);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* Fallback: Fetch from tracking API */
  const fetchTracking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const res = await axios.get(
        `${API_URL}/public/track/${parcelCode}`
      );

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setTrackingInfo(data);

        if (data.parcel) {
          const orderData = {
            parcel_code: data.parcel.code,
            parcel_receiver: data.parcel.receiver,
            parcel_phone: data.parcel.phone,
            parcel_city: data.parcel.city?.name || data.parcel.city,
            parcel_address: data.parcel.address,
            parcel_price: data.parcel.price,
            parcel_prd_qty: data.parcel.product?.quantity || 1,
            statut: data.parcel.delivery_status,
            statut_second: data.parcel.status_second,
            payment_status: data.parcel.payment_status,
            date: data.parcel.created_date,
            status_history: data.tracking?.history?.map(h => ({
              old_status: null,
              new_status: h.status,
              changed_at: h.date,
              source: 'tracking'
            })) || []
          };
          setOrder(orderData);
          setStatusHistory(orderData.status_history);
          
          const statuses = generateAllStatuses(
            data.parcel.delivery_status,
            data.parcel.status_second,
            data.tracking?.history || []
          );
          setAllStatuses(statuses);
        }
      } else {
        setError("Commande introuvable");
      }
    } catch (err) {
      console.error(err);
      setError("Commande introuvable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="public-track-loading">
        <div className="loading-spinner"></div>
        <p>Recherche de votre commande...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="public-track-error">
        <AlertCircle size={45} />
        <h2>Commande non trouvée</h2>
        <Link to="/" className="btn-home">
          <Home size={16} />
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const deliveryStatus = order.statut;
  const secondaryStatus = order.statut_second;
  const paymentStatus = order.payment_status;
  
  const translatedDeliveryStatus = translateStatus(deliveryStatus);
  const translatedSecondaryStatus = secondaryStatus ? translateStatus(secondaryStatus) : null;
  const translatedPaymentStatus = translateStatus(paymentStatus);
  
  const DeliveryIcon = getStatusIcon(deliveryStatus);
  const SecondaryIcon = secondaryStatus ? getStatusIcon(secondaryStatus) : null;

  // Calculate completion percentage
  const completedCount = allStatuses.filter(s => s.isCompleted).length;
  const totalCount = allStatuses.filter(s => s.key !== 'CREATED' || s.isCompleted).length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="public-track-container">
      {/* WELCOME MESSAGE OVERLAY */}
      {showWelcome && !loading && order && (
        <div className="welcome-overlay">
          <div className="welcome-card">
            <div className="welcome-icon">
              <Package size={48} />
            </div>
            <h2>Bonjour {order.parcel_receiver || "Cher client"} !</h2>
            <p>Suivez votre commande en temps réel depuis ici</p>
            <div className="welcome-details">
              <div className="welcome-code">
                <span>Code colis :</span>
                <strong>{order.parcel_code}</strong>
              </div>
              <div className="welcome-status">
                <span>Statut actuel :</span>
                <strong style={{ color: getStatusColor(deliveryStatus) }}>
                  {translatedDeliveryStatus}
                  {translatedSecondaryStatus && ` - ${translatedSecondaryStatus}`}
                </strong>
              </div>
            </div>
            <div className="welcome-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: completionPercentage + '%' }}
                ></div>
              </div>
              <p>{completedCount}/{totalCount} étapes complétées</p>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="track-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Retour
        </Link>

        <button 
          className="btn-refresh" 
          onClick={() => fetchOrderWithHistory(true)}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
          {refreshing ? "Actualisation..." : "Actualiser"}
        </button>

        <div className="header-title-container">
          <img src="/logo.jpeg" alt="Logo" className="header-logo" />
          <h1>Suivi des colis</h1>
        </div>
        <p className="parcel-code-display">
          Code : <strong>{order.parcel_code}</strong>
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="track-tabs">
        <button 
          className={`track-tab ${activeTab === 'suivi' ? 'active' : ''}`}
          onClick={() => setActiveTab('suivi')}
        >
          <Truck size={18} />
          Suivi des colis
        </button>
        <button 
          className={`track-tab ${activeTab === 'livre' ? 'active' : ''}`}
          onClick={() => setActiveTab('livre')}
        >
          <History size={18} />
          Historique
        </button>
      </div>

      {/* CONTENU - Suivi des colis Tab */}
      {activeTab === 'suivi' && (
        <div className="track-content">

          {/* STATUTS */}
          <div className="status-cards">

            {/* LIVRAISON */}
            <div className="status-card">
              <div className="status-card-header">
                <Truck size={18} />
                <h3>Statut livraison</h3>
              </div>

              <div className="status-badge-container">
                <div
                  className="status-badge large"
                  style={{
                    background: `${getStatusColor(deliveryStatus)}20`,
                    color: getStatusColor(deliveryStatus),
                    border: `1px solid ${getStatusColor(deliveryStatus)}30`
                  }}
                >
                  <DeliveryIcon size={16} style={{ marginRight: 8 }} />
                  {translatedDeliveryStatus || "En attente"}
                </div>
                
                {secondaryStatus && secondaryStatus !== '' && (
                  <div
                    className="status-badge large secondary"
                    style={{
                      background: `${getStatusColor(secondaryStatus)}20`,
                      color: getStatusColor(secondaryStatus),
                      border: `1px solid ${getStatusColor(secondaryStatus)}30`,
                      marginLeft: '8px'
                    }}
                  >
                    <SecondaryIcon size={16} style={{ marginRight: 8 }} />
                    {translatedSecondaryStatus}
                  </div>
                )}
              </div>
            </div>

            {/* PAIEMENT */}
            <div className="status-card">
              <div className="status-card-header">
                <CreditCard size={18} />
                <h3>Paiement</h3>
              </div>

              <div
                className="status-badge"
                style={{
                  background: translatedPaymentStatus === "Payé" ? "#22c55e20" : 
                              translatedPaymentStatus === "Non payé" ? "#ef444420" : "#eef2ff",
                  color: translatedPaymentStatus === "Payé" ? "#22c55e" : 
                         translatedPaymentStatus === "Non payé" ? "#ef4444" : "#1e63d5"
                }}
              >
                {translatedPaymentStatus || "Non disponible"}
              </div>
            </div>
          </div>

          {/* DÉTAILS */}
          <div className="details-grid">

            <div className="detail-card">
              <div className="detail-card-header">
                <User size={18} />
                Client
              </div>

              <div className="detail-row">
                <span>Nom</span>
                <span>{order.parcel_receiver}</span>
              </div>

              <div className="detail-row">
                <span>Téléphone</span>
                <span>{order.parcel_phone}</span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <MapPin size={18} />
                Adresse
              </div>

              <div className="detail-row">
                <span>Ville</span>
                <span>{order.parcel_city}</span>
              </div>

              <div className="detail-row">
                <span>Adresse</span>
                <span>{order.parcel_address}</span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <Package size={18} />
                Colis
              </div>

              <div className="detail-row">
                <span>Quantité</span>
                <span>{order.parcel_prd_qty}</span>
              </div>

              <div className="detail-row">
                <span>Prix</span>
                <span>{order.parcel_price} MAD</span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <Calendar size={18} />
                Date
              </div>

              <div className="detail-row">
                <span>Commande</span>
                <span>{formatDate(order.date)}</span>
              </div>
            </div>

          </div>

          {/* TIMELINE PROGRESS */}
          {allStatuses.length > 0 && (
            <div className="timeline-progress">
              <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} />
                Progression de la commande
              </h3>
              
              <div className="timeline-horizontal">
                {allStatuses.map((status, index) => (
                  <div key={index} className={`timeline-step ${status.isCompleted ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}>
                    <div 
                      className="timeline-step-dot"
                      style={{
                        background: status.isCompleted ? status.color : 
                                   status.isCurrent ? status.color : '#e0e0e0',
                        border: `2px solid ${status.color}40`
                      }}
                    >
                      {status.isCompleted && <CheckCircle size={10} color="white" />}
                    </div>
                    <div className="timeline-step-label">{status.label}</div>
                    {status.date && status.isCompleted && (
                      <div className="timeline-step-date">{formatDate(status.date)}</div>
                    )}
                    {index < allStatuses.length - 1 && (
                      <div className={`timeline-line ${status.isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENU - Historique Tab */}
      {activeTab === 'livre' && (
        <div className="track-content">
          {/* COMPLETE ORDER HISTORY FROM STATUS_HISTORIQUE */}
          {statusHistory.length > 0 && (
            <div className="timeline">
              <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={20} />
                Historique complet des statuts
              </h3>

              {statusHistory.map((item, index) => {
                const oldDisplay = item.old_status && item.old_status_second 
                  ? `${translateStatus(item.old_status)} - ${translateStatus(item.old_status_second)}`
                  : item.old_status ? translateStatus(item.old_status) : 'Création';
                
                const newDisplay = item.new_status && item.new_status_second 
                  ? `${translateStatus(item.new_status)} - ${translateStatus(item.new_status_second)}`
                  : item.new_status ? translateStatus(item.new_status) : 'En cours';
                
                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-dot completed" style={{ background: getStatusColor(item.new_status) }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                    <div className="timeline-content completed">
                      <span className="timeline-time">
                        {formatDate(item.changed_at)}
                      </span>
                      <span>
                        {item.old_status === null ? (
                          <>Commande créée avec le statut <strong>{newDisplay}</strong></>
                        ) : (
                          <>Statut changé de <strong>{oldDisplay}</strong> → <strong>{newDisplay}</strong></>
                        )}
                        {item.source && (
                          <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>
                            ({item.source === 'webhook' ? 'auto' : item.source === 'manual_update' ? 'manuel' : item.source})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TIMELINE VIEW */}
          {allStatuses.length > 0 && (
            <div className="timeline" style={{ marginTop: statusHistory.length > 0 ? 30 : 0 }}>
              <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} />
                Parcours de la commande
              </h3>

              {allStatuses.map((status, index) => (
                <div key={index} className="timeline-item">
                  <div 
                    className={`timeline-dot ${status.isCompleted ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}
                    style={{
                      background: status.isCompleted ? status.color : 
                                 status.isCurrent ? status.color : '#e0e0e0',
                      border: `4px solid ${status.color}30`
                    }}
                  >
                    {status.isCompleted && <CheckCircle size={12} color="white" />}
                  </div>

                  <div 
                    className={`timeline-content ${status.isCompleted ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}
                    style={{
                      borderLeft: `3px solid ${status.isCompleted || status.isCurrent ? status.color : '#e0e0e0'}`
                    }}
                  >
                    <span className="timeline-time">
                      {status.date ? formatDate(status.date) : 
                       status.isCurrent ? 'En cours' : 'À venir'}
                    </span>
                    <span style={{ 
                      fontWeight: status.isCurrent ? 'bold' : 'normal',
                      color: status.isCompleted ? status.color : 
                            status.isCurrent ? status.color : '#666'
                    }}>
                      {status.label}
                      {status.isCurrent && status.hasSecondary && secondaryStatus && (
                        <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.8 }}>
                          ({translateStatus(secondaryStatus)})
                        </span>
                      )}
                      {status.isCurrent && ' (Actuel)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PIED DE PAGE */}
      <div className="track-footer">
        <p>
          <Info size={14} />
          Pour toute information, contactez le support.
        </p>
      </div>
    </div>
  );
}