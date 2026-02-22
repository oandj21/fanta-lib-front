import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Pencil, Trash2, Check, Search, XCircle, Filter, 
  X, Save, MapPin, Phone, User, Package, DollarSign,
  Map, FileText, Truck, UserCircle, Building
} from "lucide-react";
import { 
  fetchCommandes, 
  updateCommande, 
  deleteCommande, 
  markCommandeAsDelivered 
} from "../../store/store";
import "../../css/AdminOrders.css";

const statusLabels = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

const statusColors = {
  new: "#666",
  confirmed: "#007bff",
  shipped: "#ffc107",
  delivered: "#28a745",
  cancelled: "#dc3545",
  returned: "#6f42c1",
};

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { list: orderList = [], loading } = useSelector((state) => state.commandes);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  
  // Form state for update
  const [formData, setFormData] = useState({
    parcel_receiver: "",
    parcel_phone: "",
    parcel_city: "",
    parcel_address: "",
    parcel_price: "",
    parcel_note: "",
    parcel_open: 0,
    parcel_livreur_sent: "",
    parcel_livreurname_sent: "",
    statut: "new"
  });

  useEffect(() => {
    dispatch(fetchCommandes());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Update form data when selected order changes
  useEffect(() => {
    if (selectedOrder) {
      setFormData({
        parcel_receiver: selectedOrder.parcel_receiver || "",
        parcel_phone: selectedOrder.parcel_phone || "",
        parcel_city: selectedOrder.parcel_city || "",
        parcel_address: selectedOrder.parcel_address || "",
        parcel_price: selectedOrder.parcel_price || "",
        parcel_note: selectedOrder.parcel_note || "",
        parcel_open: selectedOrder.parcel_open || 0,
        parcel_livreur_sent: selectedOrder.parcel_livreur_sent || "",
        parcel_livreurname_sent: selectedOrder.parcel_livreurname_sent || "",
        statut: selectedOrder.statut || "new"
      });
    }
  }, [selectedOrder]);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      dispatch(deleteCommande(id));
    }
  };

  const markDelivered = (id) => {
    if (window.confirm("Marquer cette commande comme livrée ?")) {
      dispatch(markCommandeAsDelivered(id));
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateError(null);
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedOrder(null);
    setFormData({
      parcel_receiver: "",
      parcel_phone: "",
      parcel_city: "",
      parcel_address: "",
      parcel_price: "",
      parcel_note: "",
      parcel_open: 0,
      parcel_livreur_sent: "",
      parcel_livreurname_sent: "",
      statut: "new"
    });
    setUpdateError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      // Filter out empty values to only send changed fields
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== selectedOrder[key] && formData[key] !== "") {
          updateData[key] = formData[key];
        }
      });

      // Always include status if it's changed
      if (formData.statut !== selectedOrder.statut) {
        updateData.statut = formData.statut;
      }

      // If no changes, close modal
      if (Object.keys(updateData).length === 0) {
        closeUpdateModal();
        return;
      }

      console.log("Updating order with data:", updateData);
      
      // Dispatch update action
      const result = await dispatch(updateCommande({ 
        id: selectedOrder.id, 
        ...updateData 
      })).unwrap();

      console.log("Update successful:", result);
      
      // Refresh orders list
      await dispatch(fetchCommandes());
      
      closeUpdateModal();
      
    } catch (error) {
      console.error("Update failed:", error);
      setUpdateError(
        error?.message || 
        "Erreur lors de la mise à jour. Veuillez réessayer."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orderList.filter(order => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        order.parcel_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_receiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || order.statut === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort by date (most recent first)
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [orderList, searchTerm, statusFilter]);

  // Get current page orders
  const currentOrders = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const stats = {
    total: orderList.length,
    new: orderList.filter(o => o.statut === "new").length,
    confirmed: orderList.filter(o => o.statut === "confirmed").length,
    shipped: orderList.filter(o => o.statut === "shipped").length,
    delivered: orderList.filter(o => o.statut === "delivered").length,
    cancelled: orderList.filter(o => o.statut === "cancelled").length,
    returned: orderList.filter(o => o.statut === "returned").length,
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Pagination component
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
            aria-label="Page précédente"
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
            aria-label="Page suivante"
          >
            &rsaquo;
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="admin-loading">Chargement des commandes...</div>;
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <div>
          <h2>Gestion des Commandes</h2>
          <p className="orders-subtitle">
            {filteredOrders.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)} - ${Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur ${filteredOrders.length} commande${filteredOrders.length !== 1 ? 's' : ''} (${orderList.length} total)`
              : `0 commande affichée sur ${orderList.length} total`
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="orders-stats-grid">
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label">Total commandes</span>
            <span className="order-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.new }}>Nouvelles</span>
            <span className="order-stat-value">{stats.new}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.confirmed }}>Confirmées</span>
            <span className="order-stat-value">{stats.confirmed}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.shipped }}>Expédiées</span>
            <span className="order-stat-value">{stats.shipped}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.delivered }}>Livrées</span>
            <span className="order-stat-value">{stats.delivered}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.cancelled }}>Annulées</span>
            <span className="order-stat-value">{stats.cancelled}</span>
          </div>
        </div>
        <div className="order-stat-card">
          <div className="order-stat-content">
            <span className="order-stat-label" style={{ color: statusColors.returned }}>Retournées</span>
            <span className="order-stat-value">{stats.returned}</span>
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Ville</th>
                  <th>Adresse</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Livreur</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-code">{order.parcel_code || "-"}</td>
                    <td className="order-client">{order.parcel_receiver || "-"}</td>
                    <td>{order.parcel_phone || "-"}</td>
                    <td>{order.parcel_city || "-"}</td>
                    <td className="order-address" title={order.parcel_address}>
                      {order.parcel_address ? 
                        (order.parcel_address.length > 30 ? 
                          order.parcel_address.substring(0, 30) + "..." : 
                          order.parcel_address) 
                        : "-"}
                    </td>
                    <td className="order-price">{order.parcel_price ? `${order.parcel_price} MAD` : "-"}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${statusColors[order.statut] || "#666"}20`,
                          color: statusColors[order.statut] || "#666",
                          border: `1px solid ${(statusColors[order.statut] || "#666")}40`
                        }}
                      >
                        {statusLabels[order.statut] || order.statut || "Nouvelle"}
                      </span>
                    </td>
                    <td>
                      {order.parcel_livreurname_sent || order.parcel_livreur_sent || "-"}
                    </td>
                    <td>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openUpdateModal(order)}
                          className="btn-icon edit"
                          title="Modifier la commande"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => markDelivered(order.id)}
                          className="btn-icon success"
                          title="Marquer livrée"
                          disabled={order.statut === "delivered"}
                        >
                          <Check size={16} />
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
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination />
        </>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal-content update-order-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier la commande</h3>
              <button onClick={closeUpdateModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {updateError && (
                <div className="modal-error">
                  <span className="error-icon">⚠️</span>
                  {updateError}
                </div>
              )}

              <form onSubmit={handleUpdateSubmit} className="update-form">
                <div className="form-section">
                  <h4>
                    <User size={16} />
                    Informations client
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_receiver">
                        <UserCircle size={14} />
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="parcel_receiver"
                        name="parcel_receiver"
                        value={formData.parcel_receiver}
                        onChange={handleInputChange}
                        placeholder="Nom du client"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="parcel_phone">
                        <Phone size={14} />
                        Téléphone
                      </label>
                      <input
                        type="text"
                        id="parcel_phone"
                        name="parcel_phone"
                        value={formData.parcel_phone}
                        onChange={handleInputChange}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <Map size={16} />
                    Adresse de livraison
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_city">
                        <Building size={14} />
                        Ville
                      </label>
                      <input
                        type="text"
                        id="parcel_city"
                        name="parcel_city"
                        value={formData.parcel_city}
                        onChange={handleInputChange}
                        placeholder="Ville"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="parcel_address">
                        <MapPin size={14} />
                        Adresse complète
                      </label>
                      <textarea
                        id="parcel_address"
                        name="parcel_address"
                        value={formData.parcel_address}
                        onChange={handleInputChange}
                        placeholder="Adresse détaillée"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <DollarSign size={16} />
                    Informations financières
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_price">
                        Prix (MAD)
                      </label>
                      <input
                        type="number"
                        id="parcel_price"
                        name="parcel_price"
                        value={formData.parcel_price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="statut">
                        Statut
                      </label>
                      <select
                        id="statut"
                        name="statut"
                        value={formData.statut}
                        onChange={handleInputChange}
                        className="status-select-modal"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <Truck size={16} />
                    Informations livreur
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_livreur_sent">
                        ID Livreur
                      </label>
                      <input
                        type="text"
                        id="parcel_livreur_sent"
                        name="parcel_livreur_sent"
                        value={formData.parcel_livreur_sent}
                        onChange={handleInputChange}
                        placeholder="ID du livreur"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="parcel_livreurname_sent">
                        Nom du livreur
                      </label>
                      <input
                        type="text"
                        id="parcel_livreurname_sent"
                        name="parcel_livreurname_sent"
                        value={formData.parcel_livreurname_sent}
                        onChange={handleInputChange}
                        placeholder="Nom du livreur"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <FileText size={16} />
                    Informations supplémentaires
                  </h4>
                  
                  <div className="form-group full-width">
                    <label htmlFor="parcel_note">
                      Note
                    </label>
                    <textarea
                      id="parcel_note"
                      name="parcel_note"
                      value={formData.parcel_note}
                      onChange={handleInputChange}
                      placeholder="Notes ou instructions spéciales"
                      rows="3"
                    />
                  </div>

                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="parcel_open"
                      name="parcel_open"
                      checked={formData.parcel_open === 1}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="parcel_open">
                      Colis ouvert / vérifié
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={closeUpdateModal}
                className="btn-secondary"
                disabled={updateLoading}
              >
                Annuler
              </button>
              <button 
                type="submit"
                onClick={handleUpdateSubmit}
                className="btn-primary"
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}