import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Truck, 
  Eye,
  Search, 
  Filter,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Package,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { 
  fetchCommandes, 
  updateCommande, 
  deleteCommande, 
  markCommandeAsDelivered,
  trackDelivery,
  requestReturn,
  requestRedelivery
} from "../../store/store";
import OrderForm from "../../components/OrderForm";
import DeliveryManagement from "../../components/DeliveryManagement";
import "../../css/AdminOrders.css";

const statusLabels = {
  nouvelle: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

const statusColors = {
  nouvelle: "#666",
  confirmed: "#007bff",
  shipped: "#ffc107",
  delivered: "#28a745",
  cancelled: "#dc3545",
  returned: "#6f42c1",
};

// Delivery status mapping for display
const deliveryStatusLabels = {
  'NEW_PARCEL': 'Nouveau Colis',
  'WAITING_PICKUP': 'Attente Ramassage',
  'PICKED_UP': 'Ramassé',
  'SENT': 'Expédié',
  'RECEIVED': 'Reçu',
  'DISTRIBUTION': 'En distribution',
  'IN_PROGRESS': 'En cours',
  'RETURNED': 'Retourné',
  'DELIVERED': 'Livré',
  'POSTPONED': 'Reporté',
  'NOANSWER': 'Pas de réponse',
  'UNREACHABLE': 'Injoignable',
  'OUT_OF_AREA': 'Hors-zone',
  'CANCELED': 'Annulé',
  'REFUSE': 'Refusé',
};

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { list: orderList = [], loading } = useSelector((state) => state.commandes);
  
  // UI states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    dispatch(fetchCommandes());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, deliveryFilter]);

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    dispatch(deleteCommande(id));
    setShowDeleteConfirm(null);
  };

  const markDelivered = (id) => {
    dispatch(markCommandeAsDelivered(id));
  };

  const openAddForm = () => {
    setEditingOrder(null);
    setSelectedOrder(null);
    setShowFormModal(true);
  };

  const openEditForm = (order) => {
    setEditingOrder(order);
    setSelectedOrder(order);
    setShowFormModal(true);
  };

  const openDeliveryModal = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  const handleSaveOrder = async (data) => {
    try {
      if (editingOrder) {
        await dispatch(updateCommande({ id: editingOrder.id, ...data })).unwrap();
      } else {
        await dispatch(createCommande(data)).unwrap();
      }
      setShowFormModal(false);
      dispatch(fetchCommandes());
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleTrackDelivery = async (id) => {
    try {
      const result = await dispatch(trackDelivery(id)).unwrap();
      alert('Tracking mis à jour avec succès');
    } catch (error) {
      alert('Erreur lors du tracking');
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orderList.filter(order => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        order.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.nom_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.telephone?.includes(searchTerm);
      
      // Status filter
      const matchesStatus = statusFilter === "all" || order.statut === statusFilter;
      
      // Delivery filter
      const matchesDelivery = deliveryFilter === "all" || 
        (deliveryFilter === "synced" && order.is_delivery_synced) ||
        (deliveryFilter === "not_synced" && !order.is_delivery_synced);
      
      return matchesSearch && matchesStatus && matchesDelivery;
    }).sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [orderList, searchTerm, statusFilter, deliveryFilter]);

  // Get current page orders
  const currentOrders = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: orderList.length,
      nouvelle: orderList.filter(o => o.statut === "nouvelle").length,
      confirmed: orderList.filter(o => o.statut === "confirmed").length,
      shipped: orderList.filter(o => o.statut === "shipped").length,
      delivered: orderList.filter(o => o.statut === "delivered").length,
      cancelled: orderList.filter(o => o.statut === "cancelled").length,
      returned: orderList.filter(o => o.statut === "returned").length,
      synced: orderList.filter(o => o.is_delivery_synced).length,
    };
  }, [orderList]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDeliveryFilter("all");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
        </div>
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            &lsaquo;
          </button>
          
          {startPage > 1 && (
            <>
              <button onClick={() => paginate(1)} className="pagination-btn">1</button>
              {startPage > 2 && <span className="pagination-dots">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => paginate(totalPages)} className="pagination-btn">{totalPages}</button>
            </>
          )}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            &rsaquo;
          </button>
        </div>
      </div>
    );
  };

  if (loading && !orderList.length) {
    return <div className="admin-loading">Chargement des commandes...</div>;
  }

  return (
    <div className="admin-orders">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2>Gestion des Commandes</h2>
          <p className="admin-subtitle">
            {filteredOrders.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)} - ${Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur ${filteredOrders.length} commande${filteredOrders.length !== 1 ? 's' : ''} (${stats.total} total)`
              : `0 commande affichée sur ${stats.total} total`
            }
          </p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <Plus size={18} />
          Nouvelle commande
        </button>
      </div>

      {/* Stats Cards */}
      <div className="orders-stats-grid">
        <div className="order-stat-card total">
          <div className="order-stat-content">
            <span className="order-stat-label">Total</span>
            <span className="order-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="order-stat-card new">
          <div className="order-stat-content">
            <span className="order-stat-label">Nouvelles</span>
            <span className="order-stat-value">{stats.nouvelle}</span>
          </div>
        </div>
        <div className="order-stat-card confirmed">
          <div className="order-stat-content">
            <span className="order-stat-label">Confirmées</span>
            <span className="order-stat-value">{stats.confirmed}</span>
          </div>
        </div>
        <div className="order-stat-card shipped">
          <div className="order-stat-content">
            <span className="order-stat-label">Expédiées</span>
            <span className="order-stat-value">{stats.shipped}</span>
          </div>
        </div>
        <div className="order-stat-card delivered">
          <div className="order-stat-content">
            <span className="order-stat-label">Livrées</span>
            <span className="order-stat-value">{stats.delivered}</span>
          </div>
        </div>
        <div className="order-stat-card cancelled">
          <div className="order-stat-content">
            <span className="order-stat-label">Annulées</span>
            <span className="order-stat-value">{stats.cancelled}</span>
          </div>
        </div>
        <div className="order-stat-card returned">
          <div className="order-stat-content">
            <span className="order-stat-label">Retournées</span>
            <span className="order-stat-value">{stats.returned}</span>
          </div>
        </div>
        <div className="order-stat-card synced">
          <div className="order-stat-content">
            <span className="order-stat-label">Synchro livraison</span>
            <span className="order-stat-value">{stats.synced}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par code, client, ville ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search">
              <XCircle size={16} />
            </button>
          )}
        </div>

        <button 
          className={`filters-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filtres
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Statut</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Livraison</label>
              <select 
                value={deliveryFilter} 
                onChange={(e) => setDeliveryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes</option>
                <option value="synced">Synchronisées</option>
                <option value="not_synced">Non synchronisées</option>
              </select>
            </div>

            <button onClick={clearFilters} className="btn-clear-filters">
              <XCircle size={16} />
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredOrders.length === 0 && (
        <div className="no-results">
          <Package size={48} />
          <h3>Aucune commande trouvée</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Orders Table */}
      {filteredOrders.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table orders-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Ville</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Livraison</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <>
                    <tr key={order.id} className={expandedRows[order.id] ? 'expanded' : ''}>
                      <td>
                        <button 
                          onClick={() => toggleRowExpand(order.id)}
                          className="btn-expand"
                        >
                          {expandedRows[order.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="order-code">{order.code || "-"}</td>
                      <td className="order-client">{order.nom_client || "-"}</td>
                      <td>{order.telephone || "-"}</td>
                      <td>{order.ville || "-"}</td>
                      <td className="order-total">{Number(order.total || 0).toFixed(2)} DH</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: `${statusColors[order.statut] || "#666"}20`,
                            color: statusColors[order.statut] || "#666",
                            border: `1px solid ${(statusColors[order.statut] || "#666")}40`
                          }}
                        >
                          {statusLabels[order.statut] || order.statut}
                        </span>
                      </td>
                      <td>
                        {order.is_delivery_synced ? (
                          <div className="delivery-info">
                            <span className="delivery-code" title={order.delivery_code}>
                              {order.delivery_code?.substring(0, 8)}...
                            </span>
                            {order.delivery_status && (
                              <span className={`delivery-status ${order.delivery_status.toLowerCase()}`}>
                                {deliveryStatusLabels[order.delivery_status] || order.delivery_status}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="delivery-status not-synced">Non synchronisé</span>
                        )}
                      </td>
                      <td>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => openEditForm(order)}
                            className="btn-icon edit"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openDeliveryModal(order)}
                            className="btn-icon delivery"
                            title="Gestion livraison"
                            disabled={!order.is_delivery_synced}
                          >
                            <Truck size={16} />
                          </button>
                          <button
                            onClick={() => handleTrackDelivery(order.id)}
                            className="btn-icon info"
                            title="Actualiser tracking"
                            disabled={!order.is_delivery_synced}
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => markDelivered(order.id)}
                            className="btn-icon success"
                            title="Marquer livrée"
                            disabled={order.statut === "delivered"}
                          >
                            <Package size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="btn-icon delete"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[order.id] && (
                      <tr className="expanded-row">
                        <td colSpan="10">
                          <div className="expanded-content">
                            <div className="expanded-section">
                              <h4>Détails de la commande</h4>
                              <div className="detail-grid">
                                <div className="detail-item">
                                  <User size={14} />
                                  <span>Client: {order.nom_client}</span>
                                </div>
                                <div className="detail-item">
                                  <Phone size={14} />
                                  <span>Tél: {order.telephone}</span>
                                </div>
                                <div className="detail-item">
                                  <MapPin size={14} />
                                  <span>Adresse: {order.addresse}</span>
                                </div>
                                <div className="detail-item">
                                  <DollarSign size={14} />
                                  <span>Profit: {Number(order.profit || 0).toFixed(2)} DH</span>
                                </div>
                                <div className="detail-item">
                                  <Calendar size={14} />
                                  <span>Quantité: {order.quantite}</span>
                                </div>
                              </div>
                            </div>

                            {order.is_delivery_synced && (
                              <div className="expanded-section">
                                <h4>Informations de livraison</h4>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <strong>Code:</strong> {order.delivery_code}
                                  </div>
                                  <div className="detail-item">
                                    <strong>Statut:</strong> {deliveryStatusLabels[order.delivery_status] || order.delivery_status}
                                  </div>
                                  {order.delivery_status_second && (
                                    <div className="detail-item">
                                      <strong>Secondaire:</strong> {order.delivery_status_second}
                                    </div>
                                  )}
                                  {order.delivery_pickup_point && (
                                    <div className="detail-item">
                                      <strong>Point ramassage:</strong> {order.delivery_pickup_point}
                                    </div>
                                  )}
                                  {order.last_delivery_sync && (
                                    <div className="detail-item">
                                      <strong>Dernier sync:</strong> {new Date(order.last_delivery_sync).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {order.livres && order.livres.length > 0 && (
                              <div className="expanded-section">
                                <h4>Livres dans la commande</h4>
                                <div className="books-list">
                                  {order.livres.map((livre, idx) => (
                                    <div key={idx} className="book-item">
                                      <span className="book-title">{livre.titre || 'Livre'}</span>
                                      {livre.auteur && <span className="book-author">par {livre.auteur}</span>}
                                      {livre.prix_achat && <span className="book-price">{livre.prix_achat} DH</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Confirmer la suppression</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="modal-close">
                <XCircle size={20} />
              </button>
            </div>
            <div className="delete-content">
              <p>Êtes-vous sûr de vouloir supprimer cette commande ?</p>
              <p className="delete-warning">Cette action est irréversible.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={() => confirmDelete(showDeleteConfirm)} className="btn-delete">
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-xl">
            <OrderForm
              order={editingOrder}
              onClose={() => setShowFormModal(false)}
              onSave={handleSaveOrder}
            />
          </div>
        </div>
      )}

      {/* Delivery Management Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <DeliveryManagement
              order={selectedOrder}
              onClose={() => {
                setShowDeliveryModal(false);
                setSelectedOrder(null);
              }}
              onUpdate={() => dispatch(fetchCommandes())}
            />
          </div>
        </div>
      )}
    </div>
  );
}