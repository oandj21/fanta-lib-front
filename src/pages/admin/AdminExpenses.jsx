import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, Check, AlertCircle, Search, Filter, XCircle, Calendar, Tag, DollarSign } from "lucide-react";
import { fetchDepenses, createDepense, updateDepense, deleteDepense } from "../../store/store";
import "../../css/AdminExpenses.css";

const categories = ["Fournitures", "Transport", "Marketing", "Stock", "Logiciel", "Loyer", "Autre"];

export default function AdminExpenses() {
  const dispatch = useDispatch();
  const { list: expenseList = [], loading } = useSelector((state) => state.depenses);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "Fournitures",
    description: "",
    amount: "",
  });

  useEffect(() => {
    dispatch(fetchDepenses());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, monthFilter, sortBy, sortOrder]);

  // Get unique months for filter
  const availableMonths = useMemo(() => {
    const months = expenseList.map(expense => {
      const date = new Date(expense.date || expense.created_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    return [...new Set(months)].sort().reverse();
  }, [expenseList]);

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    return expenseList.filter(expense => {
      const amount = expense.montant || expense.amount || 0;
      const category = expense.categorie || expense.category || "";
      const description = expense.description || "";
      const date = new Date(expense.date || expense.created_at);
      const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      // Search filter
      const matchesSearch = searchTerm === "" || 
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amount.toString().includes(searchTerm);
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || category === categoryFilter;
      
      // Month filter
      const matchesMonth = monthFilter === "all" || expenseMonth === monthFilter;
      
      return matchesSearch && matchesCategory && matchesMonth;
    }).sort((a, b) => {
      // Sorting
      let aVal, bVal;
      
      if (sortBy === "date") {
        aVal = new Date(a.date || a.created_at || 0).getTime();
        bVal = new Date(b.date || b.created_at || 0).getTime();
      } else if (sortBy === "amount") {
        aVal = Number(a.montant || a.amount || 0);
        bVal = Number(b.montant || b.amount || 0);
      } else if (sortBy === "category") {
        aVal = (a.categorie || a.category || "").toLowerCase();
        bVal = (b.categorie || b.category || "").toLowerCase();
      } else {
        aVal = (a.description || "").toLowerCase();
        bVal = (b.description || "").toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [expenseList, searchTerm, categoryFilter, monthFilter, sortBy, sortOrder]);

  // Get current page expenses
  const currentExpenses = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = expenseList.reduce((sum, e) => sum + Number(e.montant || e.amount || 0), 0);
    const byCategory = {};
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    categories.forEach(cat => {
      byCategory[cat] = expenseList
        .filter(e => (e.categorie || e.category) === cat)
        .reduce((sum, e) => sum + Number(e.montant || e.amount || 0), 0);
    });

    const thisMonth = expenseList
      .filter(e => {
        const date = new Date(e.date || e.created_at);
        const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return expenseMonth === currentMonth;
      })
      .reduce((sum, e) => sum + Number(e.montant || e.amount || 0), 0);

    return {
      total,
      byCategory,
      thisMonth,
      count: expenseList.length
    };
  }, [expenseList]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: "Fournitures",
      description: "",
      amount: "",
    });
    setShowModal(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      date: expense.date || new Date().toISOString().slice(0, 10),
      category: expense.categorie || expense.category || "Fournitures",
      description: expense.description || "",
      amount: expense.montant || expense.amount || "",
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    dispatch(deleteDepense(id));
    setShowDeleteConfirm(null);
  };

  const handleSave = async () => {
    const data = {
      date: form.date,
      categorie: form.category,
      description: form.description,
      montant: parseFloat(form.amount) || 0
    };

    try {
      if (editing) {
        await dispatch(updateDepense({ id: editing.id, ...data })).unwrap();
      } else {
        await dispatch(createDepense(data)).unwrap();
      }
      
      setShowModal(false);
      dispatch(fetchDepenses());
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Une erreur est survenue lors de l\'enregistrement');
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setMonthFilter("all");
    setSortBy("date");
    setSortOrder("desc");
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
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} sur {filteredExpenses.length} dépense{filteredExpenses.length !== 1 ? 's' : ''}
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

  if (loading && !expenseList.length) {
    return <div className="admin-loading">Chargement des dépenses...</div>;
  }

  return (
    <div className="admin-expenses">
      <div className="admin-header">
        <div>
          <h2>Gestion des Dépenses</h2>
          <p className="admin-subtitle">
            {filteredExpenses.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredExpenses.length)} - ${Math.min(currentPage * itemsPerPage, filteredExpenses.length)} sur ${filteredExpenses.length} dépense${filteredExpenses.length !== 1 ? 's' : ''} (${stats.count} total)`
              : `0 dépense affichée sur ${stats.count} total`
            }
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} />
          Nouvelle dépense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="expenses-stats-grid">
        <div className="expense-stat-card total">
          <div className="expense-stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="expense-stat-content">
            <span className="expense-stat-label">Total des dépenses</span>
            <span className="expense-stat-value">{Number(stats.total).toFixed(2)} DH</span>
          </div>
        </div>

        <div className="expense-stat-card month">
          <div className="expense-stat-icon">
            <Calendar size={24} />
          </div>
          <div className="expense-stat-content">
            <span className="expense-stat-label">Ce mois-ci</span>
            <span className="expense-stat-value">{Number(stats.thisMonth).toFixed(2)} DH</span>
          </div>
        </div>

        <div className="expense-stat-card count">
          <div className="expense-stat-icon">
            <Tag size={24} />
          </div>
          <div className="expense-stat-content">
            <span className="expense-stat-label">Nombre de dépenses</span>
            <span className="expense-stat-value">{stats.count}</span>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="category-stats">
        <h3>Répartition par catégorie</h3>
        <div className="category-stats-grid">
          {categories.map(category => (
            <div key={category} className="category-stat-item">
              <span className="category-stat-name">{category}</span>
              <span className="category-stat-amount">{Number(stats.byCategory[category] || 0).toFixed(2)} DH</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par description, catégorie ou montant..."
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
              <label>Catégorie</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Mois</label>
              <select 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les mois</option>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const date = new Date(year, monthNum - 1);
                  return (
                    <option key={month} value={month}>
                      {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="filter-group">
              <label>Trier par</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date">Date</option>
                <option value="amount">Montant</option>
                <option value="category">Catégorie</option>
                <option value="description">Description</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Ordre</label>
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
      {filteredExpenses.length === 0 && (
        <div className="no-results">
          <h3>Aucune dépense trouvée</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Expenses Table */}
      {filteredExpenses.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                    style={{ width: '120px' }}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => {
                      setSortBy('category');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                    style={{ width: '150px' }}
                  >
                    Catégorie {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => {
                      setSortBy('description');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                  >
                    Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => {
                      setSortBy('amount');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                    style={{ width: '120px' }}
                  >
                    Montant {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="expense-date">
                      {expense.date ? new Date(expense.date).toLocaleDateString('fr-FR') : "-"}
                    </td>
                    <td>
                      <span className="category-badge">
                        {expense.categorie || expense.category || "Autre"}
                      </span>
                    </td>
                    <td className="expense-description" title={expense.description}>
                      {expense.description || "-"}
                    </td>
                    <td className="expense-amount">
                      {Number(expense.montant || expense.amount || 0).toFixed(2)} DH
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => openEdit(expense)} 
                          className="btn-icon edit" 
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)} 
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
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="3" className="total-label">Total des dépenses affichées</td>
                    <td className="total-value">
                      {Number(currentExpenses.reduce((sum, e) => sum + Number(e.montant || e.amount || 0), 0)).toFixed(2)} DH
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {/* Pagination */}
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
                <X size={20} />
              </button>
            </div>
            <div className="delete-content">
              <AlertCircle size={48} className="delete-icon" />
              <p>Êtes-vous sûr de vouloir supprimer cette dépense ?</p>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>{editing ? "Modifier la dépense" : "Ajouter une dépense"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-grid">
                {/* Date */}
                <div className="form-group">
                  <label htmlFor="date">Date <span className="required">*</span></label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    required
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label htmlFor="category">Catégorie <span className="required">*</span></label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label htmlFor="amount">Montant (DH) <span className="required">*</span></label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>

                {/* Description */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="description">Description <span className="required">*</span></label>
                  <input
                    id="description"
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    required
                    placeholder="Description de la dépense"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  {editing ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}