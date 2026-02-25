// Order Details Modal Component with complete tracking information
const OrderDetailsModal = ({ order, onClose }) => {
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    if (order && order.parcel_code) {
      fetchTrackingInfo(order.parcel_code);
    }
  }, [order]);

  const fetchTrackingInfo = async (parcelCode) => {
    setLoadingTracking(true);
    setTrackingError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `https://fanta-lib-back-production.up.railway.app/api/welivexpress/trackparcel`,
        {
          params: { parcel_code: parcelCode },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log("Tracking response in order details:", response.data);

      if (response.data.success && response.data.data) {
        setTrackingInfo(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching tracking info:", err);
      setTrackingError("Impossible de récupérer les informations de suivi");
    } finally {
      setLoadingTracking(false);
    }
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

  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Détails de la commande #{order.parcel_code}</h3>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Real-time tracking information - ALL FIELDS FROM API */}
          {loadingTracking && (
            <div className="tracking-loading">
              <RefreshCw size={20} className="spinning" />
              <span>Chargement des informations de suivi en temps réel...</span>
            </div>
          )}

          {trackingError && (
            <div className="tracking-error">
              <AlertCircle size={20} />
              <span>{trackingError}</span>
            </div>
          )}

          {trackingInfo && trackingInfo.parcel && (
            <div className="tracking-info-section">
              <div className="tracking-info-header">
                <Truck size={20} />
                <h4>Suivi Welivexpress en temps réel</h4>
                <span className="tracking-live-bad">LIVE</span>
              </div>
              
              {/* Status Cards - Same as AdminTracker */}
              <div className="tracking-status-grid">
                <div className="tracking-status-card">
                  <div className="tracking-status-label">
                    <Truck size={14} />
                    Statut de livraison
                  </div>
                  <div 
                    className="tracking-status-bad large"
                    style={{ 
                      backgroundColor: `${getStatusColor(trackingInfo.parcel.delivery_status)}15`,
                      color: getStatusColor(trackingInfo.parcel.delivery_status),
                      border: `1px solid ${getStatusColor(trackingInfo.parcel.delivery_status)}30`
                    }}
                  >
                    {trackingInfo.parcel.delivery_status || 'Inconnu'}
                  </div>
                  {trackingInfo.tracking && (
                    <div className="tracking-status-description">
                      {trackingInfo.tracking.description}
                    </div>
                  )}
                </div>

                <div className="tracking-status-card">
                  <div className="tracking-status-label">
                    <CreditCard size={14} />
                    Statut de paiement
                  </div>
                  <div 
                    className="tracking-status-bad"
                    style={{ 
                      backgroundColor: `${getStatusColor(trackingInfo.parcel.payment_status)}15`,
                      color: getStatusColor(trackingInfo.parcel.payment_status),
                      border: `1px solid ${getStatusColor(trackingInfo.parcel.payment_status)}30`
                    }}
                  >
                    {trackingInfo.parcel.payment_status || 'Inconnu'}
                  </div>
                  <div className="tracking-payment-text">
                    {trackingInfo.parcel.payment_status_text}
                  </div>
                </div>
              </div>

              {/* Complete Parcel Information - Same as AdminTracker */}
              <div className="tracking-details-grid">
                {/* Client Information */}
                <div className="tracking-detail-card">
                  <div className="tracking-detail-header">
                    <User size={16} />
                    <h5>Client</h5>
                  </div>
                  <div className="tracking-detail-content">
                    <div className="tracking-detail-row">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">{trackingInfo.parcel.id || '-'}</span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Nom:</span>
                      <span className="detail-value">{trackingInfo.parcel.receiver || '-'}</span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Téléphone:</span>
                      <span className="detail-value">{trackingInfo.parcel.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="tracking-detail-card">
                  <div className="tracking-detail-header">
                    <MapPin size={16} />
                    <h5>Adresse</h5>
                  </div>
                  <div className="tracking-detail-content">
                    <div className="tracking-detail-row">
                      <span className="detail-label">Ville ID:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.city?.id || trackingInfo.parcel.city_id || '-'}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Ville:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.city?.name || trackingInfo.parcel.city || '-'}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Adresse:</span>
                      <span className="detail-value address">
                        {trackingInfo.parcel.address || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="tracking-detail-card">
                  <div className="tracking-detail-header">
                    <Package size={16} />
                    <h5>Colis</h5>
                  </div>
                  <div className="tracking-detail-content">
                    <div className="tracking-detail-row">
                      <span className="detail-label">Code:</span>
                      <span className="detail-value code">
                        {trackingInfo.parcel.code || '-'}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Produit:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.product?.name || '-'}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Quantité:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.product?.quantity || 1}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Prix:</span>
                      <span className="detail-value price">
                        {trackingInfo.parcel.price || 0} MAD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates Information */}
                <div className="tracking-detail-card">
                  <div className="tracking-detail-header">
                    <Calendar size={16} />
                    <h5>Dates</h5>
                  </div>
                  <div className="tracking-detail-content">
                    <div className="tracking-detail-row">
                      <span className="detail-label">Création:</span>
                      <span className="detail-value">
                        {formatDate(trackingInfo.parcel.created_at)}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Créé le:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.created_date || '-'}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Mise à jour:</span>
                      <span className="detail-value">
                        {formatDate(trackingInfo.parcel.updated_at)}
                      </span>
                    </div>
                    <div className="tracking-detail-row">
                      <span className="detail-label">Mis à jour le:</span>
                      <span className="detail-value">
                        {trackingInfo.parcel.updated_date || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note if exists */}
              {trackingInfo.parcel.note && (
                <div className="tracking-note">
                  <FileText size={16} />
                  <div className="tracking-note-content">
                    <span className="note-label">Note:</span>
                    <p>{trackingInfo.parcel.note}</p>
                  </div>
                </div>
              )}

              {/* Can Open Status */}
              <div className="tracking-can-open">
                {trackingInfo.parcel.can_open === 1 ? (
                  <div className="can-open-bad allowed">
                    <PackageCheck size={16} />
                    Colis ouvert / vérifié
                  </div>
                ) : (
                  <div className="can-open-bad not-allowed">
                    <PackageX size={16} />
                    Colis non ouvert
                  </div>
                )}
              </div>

              {/* Query Time */}
              {trackingInfo.query_time && (
                <div className="tracking-query-time">
                  <Clock size={14} />
                  <span>Dernière mise à jour: {formatDate(trackingInfo.query_time)}</span>
                </div>
              )}
            </div>
          )}

          {/* Original Order Details */}
          <div className="details-section">
            <h4>Informations de la commande</h4>
            <div className="details-grid">
              <div className="detail-group">
                <label>Client</label>
                <p>{order.parcel_receiver || "-"}</p>
              </div>
              <div className="detail-group">
                <label>Téléphone</label>
                <p>{order.parcel_phone || "-"}</p>
              </div>
              <div className="detail-group">
                <label>Quantité totale</label>
                <p>{order.parcel_prd_qty || 0}</p>
              </div>
              <div className="detail-group">
                <label>Ville</label>
                <p>{order.parcel_city || "-"}</p>
              </div>
              <div className="detail-group">
                <label>Adresse</label>
                <p>{order.parcel_address || "-"}</p>
              </div>
              <div className="detail-group">
                <label>Date</label>
                <p>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</p>
              </div>
              <div className="detail-group">
                <label>Statut</label>
                <span 
                  className="status-bad"
                  style={{ 
                    backgroundColor: `${statusColors[order.statut] || "#666"}20`,
                    color: statusColors[order.statut] || "#666",
                    border: `1px solid ${(statusColors[order.statut] || "#666")}40`
                  }}
                >
                  {statusLabels[order.statut] || order.statut || "Nouvelle"}
                </span>
              </div>
            </div>
          </div>

          {/* Books Section */}
          <div className="details-section">
            <h4>Livres commandés</h4>
            {order.livres && Array.isArray(order.livres) && order.livres.length > 0 ? (
              <table className="details-books-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.livres.map((book, index) => (
                    <tr key={index}>
                      <td>{book.titre || book.title || "-"}</td>
                      <td>{book.auteur || book.author || "-"}</td>
                      <td>{book.price || book.prix_achat || 0} MAD</td>
                      <td>{book.quantity || 1}</td>
                      <td>{(book.price || book.prix_achat || 0) * (book.quantity || 1)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-books">Aucun livre dans cette commande</p>
            )}
          </div>

          {/* Financial Section */}
          <div className="details-financial">
            <div className="financial-row">
              <span>Sous-total livres:</span>
              <span>{order.total || 0} MAD</span>
            </div>
            <div className="financial-row">
              <span>Frais de livraison:</span>
              <span>{order.frais_livraison || 0} MAD</span>
            </div>
            <div className="financial-row">
              <span>Frais de packaging:</span>
              <span>{order.frais_packaging || 0} MAD</span>
            </div>
            <div className="financial-row total">
              <span>Total (Welivexpress):</span>
              <span>{order.parcel_price || 0} MAD</span>
            </div>
            <div className="financial-row profit">
              <span>Profit:</span>
              <span>{order.profit || 0} MAD</span>
            </div>
          </div>

          {/* Order Note */}
          {order.parcel_note && (
            <div className="details-note">
              <label>Note de la commande:</label>
              <p style={{ whiteSpace: 'pre-line' }}>{order.parcel_note}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};