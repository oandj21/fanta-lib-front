import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pencil, Trash2, Check, Search, XCircle, Filter } from "lucide-react";
import { fetchCommandes, updateCommande, deleteCommande, markCommandeAsDelivered } from "../../store/store";
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
  
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("new");

  useEffect(() => {
    dispatch(fetchCommandes());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      dispatch(deleteCommande(id));
    }
  };

  const markDelivered = (id) => {
    dispatch(markCommandeAsDelivered(id));
  };

  const saveStatus = (id) => {
    dispatch(updateCommande({ id, status: editStatus }));
    setEditingId(null);
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orderList.filter(order => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        order.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
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
    new: orderList.filter(o => o.status === "new").length,
    confirmed: orderList.filter(o => o.status === "confirmed").length,
    shipped: orderList.filter(o => o.status === "shipped").length,
    delivered: orderList.filter(o => o.status === "delivered").length,
    cancelled: orderList.filter(o => o.status === "cancelled").length,
    returned: orderList.filter(o => o.status === "returned").length,
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
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
            placeholder="Rechercher par code, client ou ville..."
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
                  <th>Ville</th>
                  <th>Qté</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-code">{order.code || "-"}</td>
                    <td className="order-client">{order.client || "-"}</td>
                    <td>{order.city || "-"}</td>
                    <td className="text-center">{Number(order.quantity || 0)}</td>
                    <td className="order-total">{Number(order.total || 0).toFixed(2)} DH</td>
                    <td className="order-profit">{Number(order.profit || 0).toFixed(2)} DH</td>
                    <td>
                      {editingId === order.id ? (
                        <div className="edit-status">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="status-select"
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => saveStatus(order.id)} 
                            className="btn-icon success"
                            title="Valider"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="status-bad"
                          style={{ 
                            backgroundColor: `${statusColors[order.status] || "#666"}20`,
                            color: statusColors[order.status] || "#666",
                            border: `1px solid ${(statusColors[order.status] || "#666")}40`
                          }}
                        >
                          {statusLabels[order.status] || "Nouvelle"}
                        </span>
                      )}
                    </td>
                    <td>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            setEditingId(order.id);
                            setEditStatus(order.status || "new");
                          }}
                          className="btn-icon edit"
                          title="Modifier statut"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => markDelivered(order.id)}
                          className="btn-icon success"
                          title="Marquer livrée"
                          disabled={order.status === "delivered"}
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
    </div>
  );
}