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
  CheckCircle
} from "lucide-react";

import "../css/PublicTrackOrder.css";

// French translations for statuses (only specified ones)
const statusTranslations = {
  // Primary delivery statuses (only these 9)
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

/* COULEUR DU STATUT */
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
  
  // Payment statuses
  if (s.includes("payé") || s.includes("paid")) return "#10b981";
  if (s.includes("non payé") || s.includes("not_paid")) return "#ef4444";
  if (s.includes("facturé") || s.includes("invoiced")) return "#8b5cf6";
  if (s.includes("en attente") || s.includes("pending")) return "#6b7280";

  return "#3b82f6";
};

/* FORMAT DATE - Fixed to properly display dates */
const formatDate = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
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

// Define the complete order of statuses for timeline (only specified ones)
const statusOrder = [
  'NEW_PARCEL',
  'PARCEL_CONFIRMED',
  'PICKED_UP',
  'WAITING_PICKUP',
  'RECEIVED',
  'SENT',
  'IN_PROGRESS',
  'DISTRIBUTION',
  'DELIVERED',
  'RETURNED'
];

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();

  const [trackingInfo, setTrackingInfo] = useState(null);
  const [order, setOrder] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const API_URL =
    "https://fanta-lib-back-production-76f4.up.railway.app/api";

  useEffect(() => {
    if (parcelCode) {
      fetchTracking();
    }
  }, [parcelCode]);

  /* Generate all possible statuses for the timeline */
  const generateAllStatuses = (currentDeliveryStatus, secondaryStatus, history = []) => {
    const statuses = [];
    
    // Add all statuses from statusOrder
    statusOrder.forEach(statusKey => {
      const translatedStatus = translateStatus(statusKey);
      if (!translatedStatus) return;
      
      // Check if this status exists in history
      const historyItem = history.find(item => 
        item.status?.toUpperCase() === statusKey || 
        translateStatus(item.status) === translatedStatus
      );
      
      // Check if this is the current delivery status
      const isCurrentDeliveryStatus = 
        currentDeliveryStatus?.toUpperCase() === statusKey || 
        translateStatus(currentDeliveryStatus) === translatedStatus;
      
      // Check if this is the current secondary status
      const isCurrentSecondaryStatus = 
        secondaryStatus?.toUpperCase() === statusKey || 
        translateStatus(secondaryStatus) === translatedStatus;
      
      // Determine if this status is completed (has a date)
      let isCompleted = false;
      let statusDate = null;
      
      if (historyItem) {
        isCompleted = true;
        statusDate = historyItem.date;
      } else if (isCurrentDeliveryStatus || isCurrentSecondaryStatus) {
        // Current status is considered in progress
        isCompleted = false;
      }
      
      statuses.push({
        key: statusKey,
        label: translatedStatus,
        isCompleted,
        isCurrent: isCurrentDeliveryStatus || isCurrentSecondaryStatus,
        date: statusDate,
        color: getStatusColor(statusKey)
      });
    });
    
    return statuses;
  };

  /* RECHERCHER SUIVI */
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

        /* Construire l'objet commande à partir de l'API */
        if (data.parcel) {
          const orderData = {
            parcel_code: data.parcel.code,
            parcel_receiver: data.parcel.receiver,
            parcel_phone: data.parcel.phone,
            parcel_city:
              data.parcel.city?.name || data.parcel.city,
            parcel_address: data.parcel.address,
            parcel_price: data.parcel.price,
            parcel_prd_qty: data.parcel.product?.quantity || 1,
            statut: data.parcel.delivery_status,
            statut_second: data.parcel.status_second,
            payment_status: data.parcel.payment_status,
            date: data.parcel.created_date
          };
          setOrder(orderData);
          
          // Generate all statuses for timeline
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
  
  // Traduire les statuts
  const translatedDeliveryStatus = translateStatus(deliveryStatus);
  const translatedSecondaryStatus = secondaryStatus ? translateStatus(secondaryStatus) : null;
  const translatedPaymentStatus = translateStatus(paymentStatus);

  return (
    <div className="public-track-container">

      {/* EN-TÊTE */}
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

        <h1>Suivi des colis</h1>
        <p className="parcel-code-display">
          Code : <strong>{order.parcel_code}</strong>
        </p>
      </div>

      {/* CONTENU */}
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

        {/* HISTORIQUE COMPLET DU COLIS - Only specified statuses */}
        {allStatuses.length > 0 && (
          <div className="timeline">
            <h3 style={{ marginBottom: 15 }}>
              Historique du colis
            </h3>

            {allStatuses.map((status, index) => (
              <div key={index} className="timeline-item">
                <div 
                  className={`timeline-dot ${status.isCompleted ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}
                  style={{
                    background: status.isCompleted ? status.color : 
                               status.isCurrent ? status.color : '#e0e0e0',
                    border: status.isCompleted ? `4px solid ${status.color}30` : 
                           status.isCurrent ? `4px solid ${status.color}30` : '4px solid #f0f0f0'
                  }}
                >
                  {status.isCompleted && <CheckCircle size={12} color="white" />}
                </div>

                <div 
                  className={`timeline-content ${status.isCompleted ? 'completed' : ''} ${status.isCurrent ? 'current' : ''}`}
                  style={{
                    borderLeft: status.isCompleted ? `3px solid ${status.color}` : 
                               status.isCurrent ? `3px solid ${status.color}` : '3px solid #e0e0e0'
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
                    {status.isCurrent && ' (Actuel)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Original history from API (if available) */}
        {trackingInfo?.tracking?.history?.length > 0 && (
          <div className="timeline original-history">
            <h3 style={{ marginBottom: 15, marginTop: 30 }}>
              Historique détaillé
            </h3>

            {trackingInfo.tracking.history.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot completed" style={{ background: getStatusColor(item.status) }}>
                  <CheckCircle size={12} color="white" />
                </div>

                <div className="timeline-content completed">
                  <span className="timeline-time">
                    {formatDate(item.date)}
                  </span>
                  <span>{translateStatus(item.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

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