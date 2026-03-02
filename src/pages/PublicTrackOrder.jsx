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
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Home,
  Info,
  ChevronRight,
  Map
} from "lucide-react";
import "../css/PublicTrackOrder.css";

// Helper to get status color
const getStatusColor = (status) => {
  if (!status) return '#6b7280';
  
  const statusLower = status.toLowerCase();
  
  if (status === 'NEW_PARCEL' || statusLower.includes('nouveau')) return '#3b82f6';
  if (status === 'PARCEL_CONFIRMED' || statusLower.includes('confirm')) return '#8b5cf6';
  if (status === 'PARCEL_IN_TRANSIT' || statusLower.includes('transit') || statusLower.includes('expéd')) return '#f59e0b';
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

// Format date for history
const formatHistoryDate = (dateString) => {
  if (!dateString) return { date: "-", time: "" };
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function PublicTrackOrder() {
  const { parcelCode } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const API_URL = "https://fanta-lib-back-production-76f4.up.railway.app/api";

  useEffect(() => {
    if (parcelCode) {
      fetchTrackingInfo();
    }
  }, [parcelCode]);

  const fetchTrackingInfo = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/public/track/${parcelCode}`);
      
      console.log("Tracking response:", response.data);
      
      if (response.data.success && response.data.data) {
        setTrackingInfo(response.data.data);
        
        if (response.data.data.parcel) {
          const canOpen = response.data.data.parcel.can_open;
          
          let parcelOpenValue = 0;
          if (canOpen !== undefined && canOpen !== null) {
            if (typeof canOpen === 'number') {
              parcelOpenValue = canOpen;
            } else if (typeof canOpen === 'string') {
              parcelOpenValue = parseInt(canOpen) || 0;
            } else if (typeof canOpen === 'boolean') {
              parcelOpenValue = canOpen ? 1 : 0;
            }
          }
          
          const trackingOrder = {
            parcel_code: response.data.data.parcel.code || parcelCode,
            parcel_receiver: response.data.data.parcel.receiver || 'Client',
            parcel_phone: response.data.data.parcel.phone || '',
            parcel_prd_qty: response.data.data.parcel.product?.quantity || 1,
            parcel_city: response.data.data.parcel.city?.name || response.data.data.parcel.city || '',
            parcel_address: response.data.data.parcel.address || '',
            parcel_price: response.data.data.parcel.price || 0,
            parcel_open: parcelOpenValue,
            parcel_note: response.data.data.parcel.note || '',
            statut: response.data.data.parcel.delivery_status || 'En attente',
            date: response.data.data.parcel.created_date || new Date().toISOString().split('T')[0],
            livres: []
          };
          
          setOrder(trackingOrder);
        }
      } else {
        setError("Commande introuvable. Vérifiez le code de suivi.");
      }
    } catch (err) {
      console.error("Error fetching tracking:", err);
      setError("Commande introuvable. Vérifiez le code de suivi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTrackingInfo(true);
  };

  const copyTrackingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // Generate mock history if not available from API
  const getTrackingHistory = () => {
    if (trackingInfo?.tracking_history && trackingInfo.tracking_history.length > 0) {
      return trackingInfo.tracking_history;
    }
    
    // Mock history based on current status
    const status = order?.statut || 'En attente';
    const createdDate = order?.date ? new Date(order.date) : new Date();
    
    const history = [
      {
        status: 'En attente',
        date: createdDate.toISOString(),
        description: 'Colis enregistré'
      }
    ];
    
    if (status.toLowerCase().includes('livré') || status === 'PARCEL_DELIVERED') {
      const deliveredDate = new Date(createdDate);
      deliveredDate.setDate(deliveredDate.getDate() + 2);
      deliveredDate.setHours(14, 40);
      
      history.push(
        {
          status: 'Ramassage en cours',
          date: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          description: 'Colis en cours de ramassage'
        },
        {
          status: 'Ramassé',
          date: new Date(createdDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          description: 'Colis ramassé par le transporteur'
        },
        {
          status: 'Entrepôt',
          date: new Date(createdDate.getTime() + 10 * 60 * 60 * 1000).toISOString(),
          description: 'Colis arrivé à l\'entrepôt'
        },
        {
          status: 'En transit',
          date: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          description: 'Colis en transit vers la ville de destination'
        },
        {
          status: 'Distribué',
          date: new Date(createdDate.getTime() + 30 * 60 * 60 * 1000).toISOString(),
          description: 'Colis distribué au livreur'
        },
        {
          status: 'En cours de livraison',
          date: new Date(createdDate.getTime() + 32 * 60 * 60 * 1000).toISOString(),
          description: 'Livreur en route vers l\'adresse de livraison'
        },
        {
          status: 'Livré',
          date: deliveredDate.toISOString(),
          description: 'Colis livré avec succès'
        }
      );
    } else if (status.toLowerCase().includes('transit') || status === 'PARCEL_IN_TRANSIT') {
      history.push(
        {
          status: 'Ramassage en cours',
          date: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          description: 'Colis en cours de ramassage'
        },
        {
          status: 'Ramassé',
          date: new Date(createdDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          description: 'Colis ramassé par le transporteur'
        },
        {
          status: 'Entrepôt',
          date: new Date(createdDate.getTime() + 10 * 60 * 60 * 1000).toISOString(),
          description: 'Colis arrivé à l\'entrepôt'
        },
        {
          status: 'En transit',
          date: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          description: 'Colis en transit vers la ville de destination'
        }
      );
    } else if (status.toLowerCase().includes('confirm') || status === 'PARCEL_CONFIRMED') {
      history.push(
        {
          status: 'Ramassage en cours',
          date: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          description: 'Colis en cours de ramassage'
        },
        {
          status: 'Ramassé',
          date: new Date(createdDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          description: 'Colis ramassé par le transporteur'
        }
      );
    }
    
    return history;
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

  const deliveryStatus = trackingInfo?.parcel?.delivery_status || order.statut;
  const paymentStatus = trackingInfo?.parcel?.payment_status;
  const paymentText = trackingInfo?.parcel?.payment_status_text;
  const trackingHistory = getTrackingHistory();
  
  // Mask phone number
  const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  };

  return (
    <div className="public-track-container">
      {/* Header with Logo */}
      <div className="track-header">
        <div className="track-header-content">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
          
          <div className="header-main">
            <div className="logo-container">
              {!logoError ? (
                <img 
                  src="/logo.jpeg" 
                  alt="Sendit" 
                  className="header-logo"
                  onError={handleLogoError}
                />
              ) : (
                <div className="logo-fallback">
                  <Package size={32} />
                  <span>Sendit</span>
                </div>
              )}
            </div>
            
            <div className="header-title">
              <h1>Suivi des colis et des livraisons</h1>
              <p className="parcel-code-display">
                Code : <strong>{order.parcel_code}</strong>
              </p>
            </div>
            
            <button onClick={copyTrackingLink} className="btn-copy-link">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Lien copié !" : "Copier le lien"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="track-content">
        {/* Destination Card - Style inspired by image */}
        <div className="destination-card">
          <div className="destination-header">
            <MapPin size={18} />
            <h3>Destination</h3>
          </div>
          <div className="destination-content">
            <div className="destination-item">
              <span className="destination-city">{order.parcel_city || 'Non spécifiée'}</span>
            </div>
            {order.parcel_address && (
              <div className="destination-item">
                <span className="destination-address">{order.parcel_address}</span>
              </div>
            )}
          </div>
          
          <div className="status-badge-container">
            <span className="status-label">Statut</span>
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
          </div>
        </div>

        {/* Contact & Payment Info - Style inspired by image */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-header">
              <Phone size={16} />
              <span>N° Téléphone :</span>
            </div>
            <div className="info-value">
              {order.parcel_phone ? maskPhone(order.parcel_phone) : 'Non renseigné'}
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-header">
              <CreditCard size={16} />
              <span>Montant :</span>
            </div>
            <div className="info-value price">
              {order.parcel_price} DH
            </div>
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

        {/* Tracking History - Style inspired by image */}
        <div className="history-section">
          <h3 className="history-title">Historique des statuts de votre colis</h3>
          
          <div className="timeline">
            {trackingHistory.map((event, index) => {
              const { date, time } = formatHistoryDate(event.date);
              return (
                <div key={index} className="timeline-item">
                  <div className="timeline-date">
                    <span className="date">{date}</span>
                    <span className="time">{time}</span>
                  </div>
                  <div className="timeline-content">
                    <ChevronRight size={16} className="timeline-arrow" />
                    <div className="timeline-status">
                      <span 
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(event.status) }}
                      ></span>
                      <span className="status-text">{event.status}</span>
                      {event.description && (
                        <span className="status-description"> - {event.description}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional details in a compact card */}
        <div className="compact-details">
          <div className="compact-row">
            <div className="compact-item">
              <User size={14} />
              <span className="compact-label">Client:</span>
              <span className="compact-value">{order.parcel_receiver}</span>
            </div>
            <div className="compact-item">
              <Package size={14} />
              <span className="compact-label">Qté:</span>
              <span className="compact-value">{order.parcel_prd_qty || 1}</span>
            </div>
          </div>
          
          <div className="compact-row">
            <div className="compact-item">
              <PackageCheck size={14} />
              <span className="compact-label">Ouverture:</span>
              <span className="compact-value">
                {order.parcel_open === 1 || order.parcel_open === true ? 'Autorisée' : 'Non autorisée'}
              </span>
            </div>
            <div className="compact-item">
              <Calendar size={14} />
              <span className="compact-label">Date:</span>
              <span className="compact-value">
                {order.date ? new Date(order.date).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
          </div>
        </div>

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

        {/* Update time */}
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