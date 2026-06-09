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
  History
} from "lucide-react";

import "../css/PublicTrackOrder.css";

// ✅ French translations for all statuses (including new ones)
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
  'CANCELLED': 'Annulé',      // ✅ added
  'CANCELED': 'Annulé',       // variant
  // Payment statuses
  'PAID': 'Payé',
  'NOT_PAID': 'Non payé',
  'INVOICED': 'Facturé',
  'PENDING': 'En attente'
};

// Helper to translate status
const translateStatus = (status) => {
  if (!status) return '';
  const statusUpper = status.toUpperCase();
  return statusTranslations[statusUpper] || status;
};

// Color mapping for status badges
const getStatusColor = (status) => {
  if (!status) return "#6b7280";
  const s = status.toLowerCase();
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
  if (s.includes("annulé") || s.includes("cancelled")) return "#ef4444";
  // Payment
  if (s.includes("payé") || s.includes("paid")) return "#10b981";
  if (s.includes("non payé") || s.includes("not_paid")) return "#ef4444";
  if (s.includes("facturé") || s.includes("invoiced")) return "#8b5cf6";
  if (s.includes("en attente") || s.includes("pending")) return "#6b7280";
  return "#3b82f6";
};

// Date formatter
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
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

// ============================================================
// ✅ CUSTOM TIMELINE SEQUENCE (as requested by user)
// ============================================================
const TIMELINE_STEPS = [
  { key: 'ORDER_CREATED', label: 'Créée', backendStatus: null },
  { key: 'NEW_PARCEL', label: 'Nouveau colis', backendStatus: 'NEW_PARCEL' },
  { key: 'PARCEL_CONFIRMED', label: 'Colis confirmé', backendStatus: 'PARCEL_CONFIRMED' },
  { key: 'WAITING_PICKUP', label: 'En attente de ramassage', backendStatus: 'WAITING_PICKUP' },
  { key: 'PICKED_UP', label: 'Ramassé', backendStatus: 'PICKED_UP' },
  { key: 'RECEIVED', label: 'Reçu', backendStatus: 'RECEIVED' },
  { key: 'SENT', label: 'Expédié', backendStatus: 'SENT' },
  { key: 'IN_PROGRESS', label: 'En cours', backendStatus: 'IN_PROGRESS' },
  { key: 'DISTRIBUTION', label: 'En distribution', backendStatus: 'DISTRIBUTION' },
  { key: 'DELIVERED', label: 'Livré', backendStatus: 'DELIVERED' },
  { key: 'RETURNED', label: 'Retourné', backendStatus: 'RETURNED' },
  { key: 'CANCELLED', label: 'Annulé', backendStatus: 'CANCELLED' }
];

// Order of steps (by index) for comparison
const STATUS_ORDER_INDEX = {
  'ORDER_CREATED': 0,
  'NEW_PARCEL': 1,
  'PARCEL_CONFIRMED': 2,
  'WAITING_PICKUP': 3,
  'PICKED_UP': 4,
  'RECEIVED': 5,
  'SENT': 6,
  'IN_PROGRESS': 7,
  'DISTRIBUTION': 8,
  'DELIVERED': 9,
  'RETURNED': 10,
  'CANCELLED': 11
};

/**
 * Build the timeline with completion statuses based on:
 * - current delivery status (statut)
 * - order creation date
 * - status history (if any)
 */
const buildTimeline = (currentStatus, secondaryStatus, orderDate, statusHistory = []) => {
  // Determine the index of the current status (if it exists in our timeline)
  let currentStatusIndex = -1;
  if (currentStatus) {
    const upperStatus = currentStatus.toUpperCase();
    const step = TIMELINE_STEPS.find(s => s.backendStatus === upperStatus);
    if (step) currentStatusIndex = STATUS_ORDER_INDEX[step.key];
  }

  // Special case: if order is cancelled, set current index to CANCELLED
  const isCancelled = currentStatus && (currentStatus.toUpperCase() === 'CANCELLED' || currentStatus.toUpperCase() === 'CANCELED');
  if (isCancelled) currentStatusIndex = STATUS_ORDER_INDEX['CANCELLED'];

  // If order is returned, set current index to RETURNED
  const isReturned = currentStatus && currentStatus.toUpperCase() === 'RETURNED';
  if (isReturned) currentStatusIndex = STATUS_ORDER_INDEX['RETURNED'];

  // Build each step
  return TIMELINE_STEPS.map((step, idx) => {
    let isCompleted = false;
    let isCurrent = false;
    let stepDate = null;

    // Step "ORDER_CREATED" is always completed (order exists)
    if (step.key === 'ORDER_CREATED') {
      isCompleted = true;
      stepDate = orderDate;
    } else {
      // Check if this exact status appears in history
      const historyEntry = statusHistory.find(entry => {
        const newStatus = entry.new_status?.toUpperCase();
        return newStatus === step.backendStatus;
      });
      if (historyEntry) {
        isCompleted = true;
        stepDate = historyEntry.changed_at;
      }

      // If the current status index is >= this step's index, it's also considered completed
      if (currentStatusIndex >= idx && currentStatusIndex !== -1) {
        isCompleted = true;
        // If no specific date from history, we don't assign a fake date
      }

      // Current step?
      if (currentStatusIndex === idx && !isCancelled && !isReturned) {
        isCurrent = true;
      } else if (isCancelled && step.key === 'CANCELLED') {
        isCurrent = true;
      } else if (isReturned && step.key === 'RETURNED') {
        isCurrent = true;
      }
    }

    return {
      key: step.key,
      label: step.label,
      isCompleted,
      isCurrent,
      date: stepDate || null,
      color: getStatusColor(step.label)
    };
  });
};

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();
  const [activeTab, setActiveTab] = useState('suivi'); // 'suivi' or 'historique'

  const [trackingInfo, setTrackingInfo] = useState(null);
  const [order, setOrder] = useState(null);
  const [timelineSteps, setTimelineSteps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = "https://fanta-lib-back-production-76f4.up.railway.app/api";

  useEffect(() => {
    if (parcelCode) {
      fetchTracking();
    }
  }, [parcelCode]);

  const fetchTracking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_URL}/public/track/${parcelCode}`);
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
            date: data.parcel.created_date
          };
          setOrder(orderData);

          // Build the custom timeline using order data + history
          const history = data.tracking?.history || [];
          const steps = buildTimeline(
            orderData.statut,
            orderData.statut_second,
            orderData.date,
            history
          );
          setTimelineSteps(steps);
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

  return (
    <div className="public-track-container">
      {/* HEADER */}
      <div className="track-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Retour
        </Link>
        <button 
          className="btn-refresh" 
          onClick={() => fetchTracking(true)}
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

      {/* TABS */}
      <div className="track-tabs">
        <button 
          className={`track-tab ${activeTab === 'suivi' ? 'active' : ''}`}
          onClick={() => setActiveTab('suivi')}
        >
          <Truck size={18} />
          Suivi des colis
        </button>
        <button 
          className={`track-tab ${activeTab === 'historique' ? 'active' : ''}`}
          onClick={() => setActiveTab('historique')}
        >
          <History size={18} />
          Parcours de la commande
        </button>
      </div>

      {/* TAB 1 : SUIVI DES COLIS (infos & détails) */}
      {activeTab === 'suivi' && (
        <div className="track-content">
          <div className="status-cards">
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
                    {translatedSecondaryStatus}
                  </div>
                )}
              </div>
            </div>
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

          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-card-header"><User size={18} /> Client</div>
              <div className="detail-row"><span>Nom</span><span>{order.parcel_receiver}</span></div>
              <div className="detail-row"><span>Téléphone</span><span>{order.parcel_phone}</span></div>
            </div>
            <div className="detail-card">
              <div className="detail-card-header"><MapPin size={18} /> Adresse</div>
              <div className="detail-row"><span>Ville</span><span>{order.parcel_city}</span></div>
              <div className="detail-row"><span>Adresse</span><span>{order.parcel_address}</span></div>
            </div>
            <div className="detail-card">
              <div className="detail-card-header"><Package size={18} /> Colis</div>
              <div className="detail-row"><span>Quantité</span><span>{order.parcel_prd_qty}</span></div>
              <div className="detail-row"><span>Prix</span><span>{order.parcel_price} MAD</span></div>
            </div>
            <div className="detail-card">
              <div className="detail-card-header"><Calendar size={18} /> Date</div>
              <div className="detail-row"><span>Commande</span><span>{formatDate(order.date)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : PARCOURS DE LA COMMANDE (timeline with checked/unchecked) */}
      {activeTab === 'historique' && (
        <div className="track-content">
          <div className="timeline">
            <h3 style={{ marginBottom: 15 }}>Parcours de la commande</h3>
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="timeline-item">
                <div 
                  className={`timeline-dot ${step.isCompleted ? 'completed' : ''} ${step.isCurrent ? 'current' : ''}`}
                  style={{
                    background: step.isCompleted ? step.color : 
                               step.isCurrent ? step.color : '#e0e0e0',
                    border: step.isCompleted ? `4px solid ${step.color}30` : 
                           step.isCurrent ? `4px solid ${step.color}30` : '4px solid #f0f0f0'
                  }}
                >
                  {step.isCompleted && <CheckCircle size={12} color="white" />}
                </div>
                <div 
                  className={`timeline-content ${step.isCompleted ? 'completed' : ''} ${step.isCurrent ? 'current' : ''}`}
                  style={{
                    borderLeft: step.isCompleted ? `3px solid ${step.color}` : 
                               step.isCurrent ? `3px solid ${step.color}` : '3px solid #e0e0e0'
                  }}
                >
                  <span className="timeline-time">
                    {step.date ? formatDate(step.date) : (step.isCompleted ? 'Complété' : 'À venir')}
                  </span>
                  <span style={{ 
                    fontWeight: step.isCurrent ? 'bold' : 'normal',
                    color: step.isCompleted ? step.color : 
                          step.isCurrent ? step.color : '#666'
                  }}>
                    {step.label}
                    {step.isCurrent && ' (Actuel)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Optional: original detailed history from API if available */}
          {trackingInfo?.tracking?.history?.length > 0 && (
            <div className="timeline original-history" style={{ marginTop: 40 }}>
              <h3 style={{ marginBottom: 15 }}>Historique détaillé (API)</h3>
              {trackingInfo.tracking.history.map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot completed" style={{ background: getStatusColor(item.status) }}>
                    <CheckCircle size={12} color="white" />
                  </div>
                  <div className="timeline-content completed">
                    <span className="timeline-time">{formatDate(item.date)}</span>
                    <span>{translateStatus(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="track-footer">
        <p><Info size={14} /> Pour toute information, contactez le support.</p>
      </div>
    </div>
  );
}