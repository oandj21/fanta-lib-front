import { useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { 
  Search, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  CreditCard,
  Truck,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  PackageCheck,
  PackageX,
  PackageSearch,
  XCircle,
  PackageSearch 
} from "lucide-react";
import "../../css/AdminTracker.css";

export default function AdminTracker() {
  const dispatch = useDispatch();
  const [parcelCode, setParcelCode] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    
    if (!parcelCode.trim()) {
      setError("Veuillez entrer un code colis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `https://fanta-lib-back-production.up.railway.app/api/welivexpress/trackparcel`,
        {
          params: { parcel_code: parcelCode.trim() },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log("Tracking response:", response.data);

      if (response.data.success && response.data.data) {
        setTrackingData(response.data.data);
        
        // Add to search history
        setSearchHistory(prev => {
          const newHistory = [
            { code: parcelCode.trim(), timestamp: new Date().toISOString() },
            ...prev.filter(item => item.code !== parcelCode.trim())
          ].slice(0, 10); // Keep last 10 searches
          return newHistory;
        });
      } else {
        setError("Aucune information trouvée pour ce colis");
        setTrackingData(null);
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError(
        err.response?.data?.error || 
        "Erreur lors de la recherche. Veuillez réessayer."
      );
      setTrackingData(null);
    } finally {
      setLoading(false);
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (code) => {
    setParcelCode(code);
    handleTrack({ preventDefault: () => {} });
  };

  const clearSearch = () => {
    setParcelCode("");
    setTrackingData(null);
    setError(null);
  };

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

  // Helper to get status color based on status text
  const getStatusColor = (status) => {
    if (!status) return '#6b7280';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('livré') || statusLower.includes('delivered')) return '#10b981';
    if (statusLower.includes('retourné') || statusLower.includes('returned')) return '#ef4444';
    if (statusLower.includes('annulé') || statusLower.includes('cancelled')) return '#6b7280';
    if (statusLower.includes('payé') || statusLower.includes('paid')) return '#10b981';
    if (statusLower.includes('non payé') || statusLower.includes('not_paid')) return '#ef4444';
    if (statusLower.includes('facturé') || statusLower.includes('invoiced')) return '#8b5cf6';
    if (statusLower.includes('nouveau') || statusLower.includes('new')) return '#3b82f6';
    if (statusLower.includes('expédié') || statusLower.includes('sent')) return '#3b82f6';
    if (statusLower.includes('voyage') || statusLower.includes('envg')) return '#06b6d4';
    if (statusLower.includes('distribution')) return '#f59e0b';
    if (statusLower.includes('ramassé') || statusLower.includes('picked')) return '#8b5cf6';
    
    return '#6b7280';
  };

  return (
    <div className="admin-tracker">
      <div className="tracker-header">
        <div>
          <h2>Tracker Colis</h2>
          <p className="tracker-subtitle">
            Suivez vos colis Welivexpress en temps réel
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="tracker-search-section">
        <form onSubmit={handleTrack} className="tracker-search-form">
          <div className="tracker-search-wrapper">
            <div className="tracker-search-input-container">
              <PackageSearch size={20} className="tracker-search-icon" />
              <input
                type="text"
                value={parcelCode}
                onChange={(e) => setParcelCode(e.target.value)}
                placeholder="Entrez le code du colis (ex: MKS092416402PK)"
                className="tracker-search-input"
                disabled={loading}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              />
              {loading && (
                <RefreshCw size={18} className="tracker-search-spinner" />
              )}
              {parcelCode && !loading && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="tracker-search-clear"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="tracker-history-dropdown">
                <div className="tracker-history-header">
                  <span>Recherches récentes</span>
                </div>
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="tracker-history-item"
                    onMouseDown={() => handleHistoryClick(item.code)}
                  >
                    <Package size={14} />
                    <span className="tracker-history-code">{item.code}</span>
                    <span className="tracker-history-time">
                      {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="tracker-search-button"
              disabled={loading || !parcelCode.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="button-spinner" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Suivre le colis
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="tracker-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Results */}
      {trackingData && trackingData.parcel && (
        <div className="tracker-results">
          {/* Header with Parcel Code */}
          <div className="tracker-result-header">
            <div className="tracker-parcel-code">
              <Package size={24} />
              <div>
                <span className="tracker-code-label">Colis</span>
                <span className="tracker-code-value">{trackingData.parcel.code}</span>
              </div>
            </div>
            <div className="tracker-query-time">
              <Clock size={14} />
              {formatDate(trackingData.query_time)}
            </div>
          </div>

          {/* Status Cards */}
          <div className="tracker-status-grid">
            <div className="tracker-status-card delivery">
              <div className="tracker-status-header">
                <Truck size={20} />
                <span>Statut de livraison</span>
              </div>
              <div 
                className="tracker-status-badge large"
                style={{ 
                  backgroundColor: `${getStatusColor(trackingData.parcel.delivery_status)}15`,
                  color: getStatusColor(trackingData.parcel.delivery_status),
                  border: `1px solid ${getStatusColor(trackingData.parcel.delivery_status)}30`
                }}
              >
                <span className="status-text">
                  {trackingData.parcel.delivery_status || 'Inconnu'}
                </span>
              </div>
              {trackingData.tracking && (
                <div className="tracker-status-description">
                  {trackingData.tracking.description}
                </div>
              )}
            </div>

            <div className="tracker-status-card payment">
              <div className="tracker-status-header">
                <CreditCard size={20} />
                <span>Statut de paiement</span>
              </div>
              <div 
                className="tracker-status-badge"
                style={{ 
                  backgroundColor: `${getStatusColor(trackingData.parcel.payment_status)}15`,
                  color: getStatusColor(trackingData.parcel.payment_status),
                  border: `1px solid ${getStatusColor(trackingData.parcel.payment_status)}30`
                }}
              >
                <span className="status-text">
                  {trackingData.parcel.payment_status || 'Inconnu'}
                </span>
              </div>
              <div className="tracker-payment-text">
                {trackingData.parcel.payment_status_text}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="tracker-info-grid">
            <div className="tracker-info-card">
              <div className="tracker-info-header">
                <User size={18} />
                <h3>Client</h3>
              </div>
              <div className="tracker-info-content">
                <div className="tracker-info-row">
                  <span className="info-label">Nom:</span>
                  <span className="info-value">{trackingData.parcel.receiver || '-'}</span>
                </div>
                <div className="tracker-info-row">
                  <span className="info-label">Téléphone:</span>
                  <span className="info-value">{trackingData.parcel.phone || '-'}</span>
                </div>
              </div>
            </div>

            <div className="tracker-info-card">
              <div className="tracker-info-header">
                <MapPin size={18} />
                <h3>Adresse</h3>
              </div>
              <div className="tracker-info-content">
                <div className="tracker-info-row">
                  <span className="info-label">Ville:</span>
                  <span className="info-value">
                    {trackingData.parcel.city?.name || trackingData.parcel.city || '-'}
                  </span>
                </div>
                <div className="tracker-info-row">
                  <span className="info-label">Adresse:</span>
                  <span className="info-value address">
                    {trackingData.parcel.address || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="tracker-info-card">
              <div className="tracker-info-header">
                <Package size={18} />
                <h3>Colis</h3>
              </div>
              <div className="tracker-info-content">
                <div className="tracker-info-row">
                  <span className="info-label">Produit:</span>
                  <span className="info-value">
                    {trackingData.parcel.product?.name || '-'}
                  </span>
                </div>
                <div className="tracker-info-row">
                  <span className="info-label">Quantité:</span>
                  <span className="info-value">
                    {trackingData.parcel.product?.quantity || 1}
                  </span>
                </div>
                <div className="tracker-info-row">
                  <span className="info-label">Prix:</span>
                  <span className="info-value price">
                    {trackingData.parcel.price || 0} MAD
                  </span>
                </div>
              </div>
            </div>

            <div className="tracker-info-card">
              <div className="tracker-info-header">
                <Calendar size={18} />
                <h3>Dates</h3>
              </div>
              <div className="tracker-info-content">
                <div className="tracker-info-row">
                  <span className="info-label">Création:</span>
                  <span className="info-value">
                    {formatDate(trackingData.parcel.created_at)}
                  </span>
                </div>
                <div className="tracker-info-row">
                  <span className="info-label">Dernière mise à jour:</span>
                  <span className="info-value">
                    {formatDate(trackingData.parcel.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Note if exists */}
          {trackingData.parcel.note && (
            <div className="tracker-note">
              <FileText size={18} />
              <div className="tracker-note-content">
                <span className="note-label">Note:</span>
                <p>{trackingData.parcel.note}</p>
              </div>
            </div>
          )}

          {/* Can Open Status */}
          <div className="tracker-can-open">
            {trackingData.parcel.can_open === 1 ? (
              <div className="can-open-badge allowed">
                <PackageCheck size={16} />
                Colis ouvert / vérifié
              </div>
            ) : (
              <div className="can-open-badge not-allowed">
                <PackageX size={16} />
                Colis non ouvert
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!trackingData && !loading && !error && (
        <div className="tracker-empty-state">
          <PackageSearch size={64} />
          <h3>Aucune recherche effectuée</h3>
          <p>
            Entrez le code d'un colis Welivexpress pour suivre son statut
            en temps réel.
          </p>
          <div className="tracker-example">
            <span>Exemple: MKS092416402PK</span>
          </div>
        </div>
      )}
    </div>
  );
}