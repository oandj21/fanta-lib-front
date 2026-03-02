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
  AlertCircle
} from "lucide-react";

import "../css/PublicTrackOrder.css";

// French translations for statuses (same as admin)
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
  'CANCELLED': 'Annulé',
  'WAITING_PICKUP': 'En attente de ramassage',
  'RECEIVED': 'Reçu',
  
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
  'RETURN_BY_AMANA': 'Retour par Amana',
  'SENT_BY_AMANA': 'Envoyé par Amana',
  
  // Payment statuses
  'PAID': 'Payé',
  'NOT_PAID': 'Non payé',
  'INVOICED': 'Facturé',
  'PENDING': 'En attente',
  
  // Generic fallbacks
  'nouveau': 'Nouveau',
  'confirmé': 'Confirmé',
  'ramassé': 'Ramassé',
  'distribution': 'En distribution',
  'en cours': 'En cours',
  'expédié': 'Expédié',
  'livré': 'Livré',
  'retourné': 'Retourné',
  'annulé': 'Annulé',
  'attente': 'En attente',
  'reçu': 'Reçu',
  'payé': 'Payé',
  'non payé': 'Non payé',
  'facturé': 'Facturé'
};

// Helper to translate status to French (same as admin)
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
  if (s.includes("transit") || s.includes("en cours") || s.includes("distribution")) return "#f59e0b";
  if (s.includes("ramassé") || s.includes("ramass") || s.includes("picked")) return "#8b5cf6";
  if (s.includes("attente") || s.includes("pending") || s.includes("waiting")) return "#6b7280";
  if (s.includes("retour") || s.includes("return")) return "#ef4444";
  if (s.includes("préparé") || s.includes("preparation") || s.includes("confirmé")) return "#007bff";
  if (s.includes("expédié") || s.includes("sent")) return "#0891b2";
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
  if (s.includes("payé") || s.includes("paid")) return "#10b981";
  if (s.includes("non payé") || s.includes("not_paid")) return "#ef4444";
  if (s.includes("facturé") || s.includes("invoiced")) return "#8b5cf6";

  return "#3b82f6";
};

/* FORMAT DATE */
const formatDate = (dateString) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();

  const [trackingInfo, setTrackingInfo] = useState(null);
  const [order, setOrder] = useState(null);

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
          setOrder({
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
          });
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

        {/* HISTORIQUE CHRONOLOGIQUE */}
        {trackingInfo?.tracking?.history?.length > 0 && (
          <div className="timeline">
            <h3 style={{ marginBottom: 15 }}>
              Historique du colis
            </h3>

            {trackingInfo.tracking.history.map((item, index) => (
              <div key={index} className="timeline-item">

                <div className="timeline-dot"></div>

                <div className="timeline-content">
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