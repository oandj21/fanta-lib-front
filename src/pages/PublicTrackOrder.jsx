// client/src/pages/PublicTrackOrder.jsx
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
  PackageCheck,
  PackageX,
  FileText,
  BookOpen,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Home,
  Info
} from "lucide-react";
import "../../css/PublicTrackOrder.css";

// Helper to get status color
const getStatusColor = (status) => {
  if (!status) return '#6b7280';
  
  const statusLower = status.toLowerCase();
  
  if (status === 'NEW_PARCEL' || statusLower.includes('nouveau')) return '#3b82f6';
  if (status === 'PARCEL_CONFIRMED' || statusLower.includes('confirm')) return '#007bff';
  if (status === 'PARCEL_IN_TRANSIT' || statusLower.includes('transit') || statusLower.includes('expéd')) return '#ffc107';
  if (status === 'PARCEL_DELIVERED' || statusLower.includes('livré') || statusLower.includes('delivered')) return '#10b981';
  if (status === 'PARCEL_CANCELLED' || statusLower.includes('annul') || statusLower.includes('cancelled')) return '#6b7280';
  if (status === 'PARCEL_RETURNED' || statusLower.includes('retour') || statusLower.includes('returned')) return '#ef4444';
  
  if (statusLower.includes('payé') || statusLower.includes('paid')) return '#10b981';
  if (statusLower.includes('non payé') || statusLower.includes('not_paid')) return '#ef4444';
  if (statusLower.includes('facturé') || statusLower.includes('invoiced')) return '#8b5cf6';
  
  return '#6b7280';
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = "https://fanta-lib-back-production.up.railway.app/api";

  useEffect(() => {
    if (parcelCode) {
      fetchOrderAndTracking();
    }
  }, [parcelCode]);

  const fetchOrderAndTracking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch the order details from public endpoint
      const orderResponse = await axios.get(`${API_URL}/commandes/public/${parcelCode}`);
      
      if (orderResponse.data) {
        setOrder(orderResponse.data);
        
        // Then fetch tracking info
        await fetchTrackingInfo(parcelCode);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Commande introuvable. Vérifiez le code de suivi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingInfo = async (code, isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    
    try {
      // Public tracking endpoint doesn't need authentication
      const response = await axios.get(`${API_URL}/public/track/${code}`);
      
      if (response.data.success && response.data.data) {
        setTrackingInfo(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching tracking:", err);
      // Don't show error for tracking, just use order data
    } finally {
      if (isRefreshing) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTrackingInfo(parcelCode, true);
  };

  const copyTrackingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Commande non trouvée</h2>
          <p>{error || "Le code de suivi que vous avez fourni est invalide."}</p>
          <Link to="/" className="btn-home">
            <Home size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Get delivery status from tracking or order
  const deliveryStatus = trackingInfo?.parcel?.delivery_status || order.statut;
  const paymentStatus = trackingInfo?.parcel?.payment_status;
  const paymentText = trackingInfo?.parcel?.payment_status_text;

  return (
    <div className="public-track-container">
      {/* Header */}
      <div className="track-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>
        
        <div className="track-header-content">
          <Package size={32} className="header-icon" />
          <h1>Suivi de commande</h1>
          <p className="parcel-code-display">Code: <strong>{order.parcel_code}</strong></p>
          
          <button onClick={copyTrackingLink} className="btn-copy-link">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Lien copié !" : "Copier le lien de suivi"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="track-content">
        {/* Status cards */}
        <div className="status-cards">
          <div className="status-card">
            <div className="status-card-header">
              <Truck size={18} />
              <h3>Statut de livraison</h3>
            </div>
            <div 
              className="status-badge large"
              style={{ 
                backgroundColor: `${getStatusColor(deliveryStatus)}15`,
                color: getStatusColor(deliveryStatus),
                border: `1px solid ${getStatusColor(deliveryStatus)}30`
              }}
            >
              {deliveryStatus || 'En attente'}
            </div>
            {trackingInfo?.tracking?.description && (
              <p className="status-description">{trackingInfo.tracking.description}</p>
            )}
          </div>

          <div className="status-card">
            <div className="status-card-header">
              <CreditCard size={18} />
              <h3>Statut de paiement</h3>
            </div>
            {paymentStatus ? (
              <>
                <div 
                  className="status-badge"
                  style={{ 
                    backgroundColor: `${getStatusColor(paymentStatus)}15`,
                    color: getStatusColor(paymentStatus),
                    border: `1px solid ${getStatusColor(paymentStatus)}30`
                  }}
                >
                  {paymentStatus}
                </div>
                {paymentText && <p className="payment-text">{paymentText}</p>}
              </>
            ) : (
              <p className="no-info">Information non disponible</p>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <button 
          onClick={handleRefresh} 
          className="btn-refresh"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Mise à jour...' : 'Actualiser le statut'}
        </button>

        {/* Order details grid */}
        <div className="details-grid">
          {/* Client info */}
          <div className="detail-card">
            <div className="detail-card-header">
              <User size={18} />
              <h3>Client</h3>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Nom:</span>
                <span className="detail-value">{order.parcel_receiver}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span className="detail-value">{order.parcel_phone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Address info */}
          <div className="detail-card">
            <div className="detail-card-header">
              <MapPin size={18} />
              <h3>Adresse de livraison</h3>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Ville:</span>
                <span className="detail-value">{order.parcel_city}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Adresse:</span>
                <span className="detail-value address">{order.parcel_address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Package info */}
          <div className="detail-card">
            <div className="detail-card-header">
              <Package size={18} />
              <h3>Colis</h3>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Quantité totale:</span>
                <span className="detail-value">{order.parcel_prd_qty || 1}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Prix du colis:</span>
                <span className="detail-value price">{order.parcel_price} MAD</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Colis ouvert:</span>
                <span className="detail-value">
                  {order.parcel_open === 1 ? (
                    <span className="can-open-allowed">
                      <PackageCheck size={14} /> Oui
                    </span>
                  ) : (
                    <span className="can-open-not-allowed">
                      <PackageX size={14} /> Non
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="detail-card">
            <div className="detail-card-header">
              <Calendar size={18} />
              <h3>Dates</h3>
            </div>
            <div className="detail-card-content">
              <div className="detail-row">
                <span className="detail-label">Date de commande:</span>
                <span className="detail-value">
                  {order.date ? new Date(order.date).toLocaleDateString('fr-FR') : '-'}
                </span>
              </div>
              {trackingInfo?.parcel?.updated_at && (
                <div className="detail-row">
                  <span className="detail-label">Dernière mise à jour:</span>
                  <span className="detail-value">{formatDate(trackingInfo.parcel.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Books section */}
        {order.livres && order.livres.length > 0 && (
          <div className="books-section">
            <div className="books-header">
              <BookOpen size={18} />
              <h3>Livres commandés</h3>
            </div>
            
            <div className="books-grid">
              {order.livres.map((book, index) => (
                <div key={index} className="book-card">
                  <h4 className="book-title">{book.titre}</h4>
                  <p className="book-author">{book.auteur || 'Auteur non spécifié'}</p>
                  <div className="book-details">
                    <span className="book-quantity">Qté: {book.quantity}</span>
                    <span className="book-price">{book.price} MAD</span>
                  </div>
                  <div className="book-total">
                    Total: {book.quantity * book.price} MAD
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {order.parcel_note && (
          <div className="note-section">
            <div className="note-header">
              <FileText size={16} />
              <h4>Note supplémentaire</h4>
            </div>
            <p className="note-content">{order.parcel_note}</p>
          </div>
        )}

        {/* Tracking timestamps */}
        {trackingInfo?.query_time && (
          <div className="update-time">
            <Clock size={14} />
            <span>Dernière mise à jour: {formatDate(trackingInfo.query_time)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="track-footer">
        <p className="footer-note">
          <Info size={14} />
          Pour toute question concernant votre commande, contactez notre service client.
        </p>
      </div>
    </div>
  );
}