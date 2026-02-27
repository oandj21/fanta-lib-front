import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Mail, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  XCircle, 
  User, 
  Calendar,
  AlertCircle,
  Check
} from "lucide-react";
import { fetchMessages, deleteMessage } from "../../store/store";
import "../../css/AdminMessages.css";

export default function AdminMessages() {
  const dispatch = useDispatch();
  const { list: messagesList = [], loading } = useSelector((state) => state.messages);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); // desc = plus récent d'abord
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMessages());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      dispatch(deleteMessage(messageToDelete.id));
      if (selectedMessage?.id === messageToDelete.id) {
        setSelectedMessage(null);
        setShowModal(false);
      }
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    }
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Date invalide";
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Date invalide";
    }
  };

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messagesList
      .filter(message => {
        // Search filter
        const matchesSearch = searchTerm === "" || 
          message.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.message?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [messagesList, searchTerm, sortOrder]);

  // Get current page messages
  const currentMessages = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredMessages.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredMessages, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = messagesList.length;
    const today = new Date().setHours(0, 0, 0, 0);
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const todayMessages = messagesList.filter(m => {
      const msgDate = new Date(m.created_at).setHours(0, 0, 0, 0);
      return msgDate === today;
    }).length;
    
    const weekMessages = messagesList.filter(m => {
      const msgDate = new Date(m.created_at);
      return msgDate >= thisWeek;
    }).length;
    
    return {
      total,
      today: todayMessages,
      thisWeek: weekMessages
    };
  }, [messagesList]);

  const clearFilters = () => {
    setSearchTerm("");
    setSortOrder("desc");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.messages-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMessages.length)} sur {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
        </div>
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="Page précédente"
          >
            <ChevronLeft size={16} />
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
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div className="admin-messages">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="delete-confirm-icon">
              <AlertCircle size={48} />
            </div>
            
            <h3 className="delete-confirm-title">Confirmer la suppression</h3>
            
            <p className="delete-confirm-message">
              Êtes-vous sûr de vouloir supprimer le message de <strong>{messageToDelete?.nom_complet}</strong> ?
            </p>
            
            <p className="delete-confirm-warning">
              Cette action est irréversible et supprimera définitivement le message.
            </p>
            
            <div className="delete-confirm-actions">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMessageToDelete(null);
                }} 
                className="btn-secondary"
              >
                Annuler
              </button>
              <button onClick={confirmDelete} className="btn-delete">
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h2>Gestion des Messages</h2>
          <p className="admin-subtitle">
            {filteredMessages.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredMessages.length)} - ${Math.min(currentPage * itemsPerPage, filteredMessages.length)} sur ${filteredMessages.length} message${filteredMessages.length !== 1 ? 's' : ''} (${stats.total} total)`
              : `0 message affiché sur ${stats.total} total`
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="messages-stats-grid">
        <div className="message-stat-card total">
          <div className="message-stat-icon">
            <Mail size={24} />
          </div>
          <div className="message-stat-content">
            <span className="message-stat-label">Total messages</span>
            <span className="message-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="message-stat-card today">
          <div className="message-stat-icon">
            <Calendar size={24} />
          </div>
          <div className="message-stat-content">
            <span className="message-stat-label">Aujourd'hui</span>
            <span className="message-stat-value">{stats.today}</span>
          </div>
        </div>

        <div className="message-stat-card week">
          <div className="message-stat-icon">
            <Calendar size={24} />
          </div>
          <div className="message-stat-content">
            <span className="message-stat-label">Cette semaine</span>
            <span className="message-stat-value">{stats.thisWeek}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou contenu du message..."
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
              <label>Ordre d'affichage</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="desc">Plus récent d'abord</option>
                <option value="asc">Plus ancien d'abord</option>
              </select>
            </div>

            <button onClick={clearFilters} className="btn-clear-filters">
              <X size={16} />
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredMessages.length === 0 && (
        <div className="no-results">
          <Mail size={48} className="no-results-icon" />
          <h3>Aucun message trouvé</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Messages Grid */}
      {filteredMessages.length > 0 && (
        <>
          <div className="messages-grid">
            {currentMessages.map((message) => (
              <div key={message.id} className="message-card" onClick={() => openMessage(message)}>
                <div className="message-card-header">
                  <div className="message-sender">
                    <div className="sender-avatar">
                      {message.nom_complet?.charAt(0) || '?'}
                    </div>
                    <div className="sender-info">
                      <h4 title={message.nom_complet}>
                        {message.nom_complet || "Anonyme"}
                      </h4>
                      <span className="message-email" title={message.email}>
                        {message.email}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="delete-btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(message);
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="message-card-body">
                  <p className="message-preview">
                    {message.message?.length > 120 
                      ? `${message.message.substring(0, 120)}...` 
                      : message.message}
                  </p>
                </div>
                <div className="message-card-footer">
                  <span className="message-date" title={formatDate(message.created_at)}>
                    <Calendar size={12} />
                    {formatShortDate(message.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <Pagination />
        </>
      )}

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content message-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détail du message</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="message-detail">
              <div className="detail-header">
                <div className="detail-sender">
                  <div className="detail-avatar">
                    {selectedMessage.nom_complet?.charAt(0) || '?'}
                  </div>
                  <div className="detail-sender-info">
                    <h4>{selectedMessage.nom_complet}</h4>
                    <p className="detail-email">{selectedMessage.email}</p>
                  </div>
                </div>
                <span className="detail-date">
                  {formatDate(selectedMessage.created_at)}
                </span>
              </div>
              
              <div className="detail-content">
                <p>{selectedMessage.message}</p>
              </div>

              <div className="detail-actions">
                <a 
                  href={`mailto:${selectedMessage.email}`}
                  className="btn-primary"
                >
                  <Mail size={16} />
                  Répondre par email
                </a>
                <button 
                  onClick={() => handleDeleteClick(selectedMessage)}
                  className="btn-danger"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}