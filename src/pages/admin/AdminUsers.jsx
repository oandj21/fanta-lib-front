// pages/admin/AdminUsers.jsx
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, X, Check, Power, Search, Filter, XCircle, AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import { 
  fetchUtilisateurs, 
  createUtilisateur, 
  updateUtilisateur, 
  deleteUtilisateur,
  toggleUtilisateurStatus,
  selectAuthUser
} from "../../store/store";
import "../../css/AdminUsers.css";

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "Utilisateur",
};

const roleColors = {
  super_admin: "bg-primary",
  admin: "bg-info-10",
  user: "bg-muted",
};

export default function AdminUsers() {
  const dispatch = useDispatch();
  const { list: userList = [], loading } = useSelector((state) => state.utilisateurs);
  const currentUser = useSelector(selectAuthUser); // Get current logged-in user
  
  // Check if current user is super_admin
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  
  // Filter out system users (is_system: true)
  const filteredUserList = useMemo(() => {
    return userList.filter(user => !user.is_system);
  }, [userList]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    is_active: true,
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle status confirmation modal
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    dispatch(fetchUtilisateurs());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Filter and search users (using filteredUserList)
  const filteredUsers = useMemo(() => {
    return filteredUserList.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);
      
      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      // Sorting
      let aVal, bVal;
      
      if (sortBy === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortBy === "email") {
        aVal = (a.email || "").toLowerCase();
        bVal = (b.email || "").toLowerCase();
      } else if (sortBy === "role") {
        aVal = (a.role || "").toLowerCase();
        bVal = (b.role || "").toLowerCase();
      } else if (sortBy === "date") {
        aVal = new Date(a.created_at || 0).getTime();
        bVal = new Date(b.created_at || 0).getTime();
      } else {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredUserList, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  // Get current page users
  const currentUsers = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Calculate statistics (using filteredUserList)
  const stats = useMemo(() => {
    const total = filteredUserList.length;
    const active = filteredUserList.filter(u => u.is_active).length;
    const inactive = filteredUserList.filter(u => !u.is_active).length;
    const superAdmins = filteredUserList.filter(u => u.role === "super_admin").length;
    const admins = filteredUserList.filter(u => u.role === "admin").length;
    const users = filteredUserList.filter(u => u.role === "user").length;
    
    return {
      total,
      active,
      inactive,
      superAdmins,
      admins,
      users
    };
  }, [filteredUserList]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      role: "user",
      is_active: true,
      password: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      is_active: user.is_active !== undefined ? user.is_active : true,
      password: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Open toggle status confirmation modal
  const openToggleConfirmation = (user) => {
    // Check if admin is trying to toggle a super_admin
    if (!isSuperAdmin && user.role === 'super_admin') {
      alert("Vous ne pouvez pas modifier le statut d'un Super Admin");
      return;
    }
    setUserToToggle(user);
    setShowToggleModal(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    // Check if admin is trying to delete a super_admin
    if (!isSuperAdmin && userToDelete.role === 'super_admin') {
      alert("Vous ne pouvez pas supprimer un Super Admin");
      setShowDeleteModal(false);
      setUserToDelete(null);
      return;
    }
    
    setIsDeleting(true);
    try {
      await dispatch(deleteUtilisateur(userToDelete.id)).unwrap();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle toggle status confirmation
  const handleConfirmToggle = async () => {
    if (!userToToggle) return;
    
    setIsToggling(true);
    try {
      await dispatch(toggleUtilisateurStatus(userToToggle.id)).unwrap();
      setShowToggleModal(false);
      setUserToToggle(null);
    } catch (error) {
      console.error("Error toggling user status:", error);
    } finally {
      setIsToggling(false);
    }
  };

  // Cancel toggle
  const handleCancelToggle = () => {
    setShowToggleModal(false);
    setUserToToggle(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Le nom est requis";
    if (!form.email.trim()) errors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Email invalide";
    if (!editing && !form.password) errors.password = "Le mot de passe est requis";
    else if (!editing && form.password.length < 6) errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editing) {
        const updateData = {
          id: editing.id,
          name: form.name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
        };
        await dispatch(updateUtilisateur(updateData)).unwrap();
      } else {
        await dispatch(createUtilisateur(form)).unwrap();
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error saving user:", error);
      if (error.errors) {
        setFormErrors(error.errors);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Date invalide";
    }
  };

  // Check if user can be edited
  const canEditUser = (user) => {
    if (isSuperAdmin) return true; // Super admin can edit anyone
    if (isAdmin) {
      // Admin cannot edit super_admin
      return user.role !== 'super_admin';
    }
    return false;
  };

  // Check if user can be toggled
  const canToggleUser = (user) => {
    if (isSuperAdmin) return true; // Super admin can toggle anyone
    if (isAdmin) {
      // Admin cannot toggle super_admin
      return user.role !== 'super_admin';
    }
    return false;
  };

  // Check if user can be deleted
  const canDeleteUser = (user) => {
    if (isSuperAdmin) return true; // Super admin can delete anyone
    if (isAdmin) {
      // Admin cannot delete super_admin
      return user.role !== 'super_admin';
    }
    return false;
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
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
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
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p className="admin-subtitle">
            {filteredUsers.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} - ${Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur ${filteredUsers.length} utilisateur${filteredUsers.length !== 1 ? 's' : ''}`
              : `0 utilisateur affiché`
            }
          </p>
        </div>
        {/* Only show add button if user can create (super_admin or admin) */}
        {(isSuperAdmin || isAdmin) && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={18} />
            Nouvel utilisateur
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="users-stats-grid">
        <div className="user-stat-card total">
          <div className="user-stat-content">
            <span className="user-stat-label">Total</span>
            <span className="user-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="user-stat-card active">
          <div className="user-stat-content">
            <span className="user-stat-label">Actifs</span>
            <span className="user-stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="user-stat-card inactive">
          <div className="user-stat-content">
            <span className="user-stat-label">Inactifs</span>
            <span className="user-stat-value">{stats.inactive}</span>
          </div>
        </div>
        <div className="user-stat-card super-admin">
          <div className="user-stat-content">
            <span className="user-stat-label">Super Admins</span>
            <span className="user-stat-value">{stats.superAdmins}</span>
          </div>
        </div>
        <div className="user-stat-card admin">
          <div className="user-stat-content">
            <span className="user-stat-label">Admins</span>
            <span className="user-stat-value">{stats.admins}</span>
          </div>
        </div>
        <div className="user-stat-card user">
          <div className="user-stat-content">
            <span className="user-stat-label">Utilisateurs</span>
            <span className="user-stat-value">{stats.users}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
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
              <label>Rôle</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les rôles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Statut</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Trier par</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Nom</option>
                <option value="email">Email</option>
                <option value="role">Rôle</option>
                <option value="date">Date d'inscription</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Ordre</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
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
      {filteredUsers.length === 0 && (
        <div className="no-results">
          <h3>Aucun utilisateur trouvé</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Users Table */}
      {filteredUsers.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                  >
                    Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => {
                      setSortBy('email');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                  >
                    Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => {
                      setSortBy('role');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                  >
                    Rôle {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Statut</th>
                  <th 
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }} 
                    className="sortable"
                  >
                    Créé le {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-name">{user.name || "N/A"}</td>
                    <td>{user.email || "N/A"}</td>
                    <td>
                      <span className={`role-badge ${roleColors[user.role] || "bg-muted"}`}>
                        {roleLabels[user.role] || user.role || "Utilisateur"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        {/* Edit button - conditionally enabled */}
                        {canEditUser(user) && (
                          <button 
                            onClick={() => openEdit(user)} 
                            className="btn-icon edit"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        
                        {/* Toggle status button - conditionally enabled */}
                        {canToggleUser(user) && (
                          <button 
                            onClick={() => openToggleConfirmation(user)} 
                            className={`btn-icon ${user.is_active ? 'warning' : 'success'}`}
                            title={user.is_active ? "Désactiver" : "Activer"}
                          >
                            <Power size={16} className={user.is_active ? 'text-warning' : 'text-success'} />
                          </button>
                        )}
                        
                        {/* Delete button - conditionally enabled */}
                        {canDeleteUser(user) && (
                          <button 
                            onClick={() => openDeleteConfirmation(user)} 
                            className="btn-icon delete"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        
                        {/* If no actions available, show disabled message */}
                        {!canEditUser(user) && !canToggleUser(user) && !canDeleteUser(user) && (
                          <span className="no-actions" title="Aucune action disponible">
                            <Shield size={16} />
                          </span>
                        )}
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

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>
                {editing ? "Modifier" : "Ajouter"} un utilisateur
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="modal-close"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Name */}
              <div className="form-group">
                <label>Nom complet <span className="required">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Jean Dupont"
                  required
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>
              
              {/* Email */}
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="jean@example.com"
                  required
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              
              {/* Password (only for new users) */}
              {!editing && (
                <div className="form-group">
                  <label>Mot de passe <span className="required">*</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    required
                  />
                  {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                </div>
              )}
              
              {/* Role - restrict options based on user role */}
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className="form-select"
                >
                  {/* Super admin can assign any role */}
                  {isSuperAdmin && (
                    <>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="user">Utilisateur</option>
                    </>
                  )}
                  
                  {/* Admin can only assign admin and user (not super_admin) */}
                  {isAdmin && (
                    <>
                      <option value="admin">Admin</option>
                      <option value="user">Utilisateur</option>
                    </>
                  )}
                </select>
                {isAdmin && (
                  <small className="form-help-text">
                    <ShieldAlert size={12} /> Vous ne pouvez pas créer de Super Admin
                  </small>
                )}
              </div>

              {/* Active status (only for edit) */}
              {editing && (
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({...form, is_active: e.target.checked})}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">Compte actif</span>
                  </label>
                </div>
              )}
              
              {/* Modal Actions */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div className="modal-confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="modal-confirm-title">Confirmer la suppression</h3>
            <p className="modal-confirm-message">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.name}</strong> ?
              <br />
              Cette action est irréversible.
            </p>
            <div className="modal-confirm-actions">
              <button 
                onClick={handleCancelDelete} 
                className="btn-secondary"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {showToggleModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div className="modal-confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="modal-confirm-title">
              {userToToggle?.is_active ? "Désactiver" : "Activer"} le compte
            </h3>
            <p className="modal-confirm-message">
              Êtes-vous sûr de vouloir {userToToggle?.is_active ? "désactiver" : "activer"} le compte de <strong>{userToToggle?.name}</strong> ?
            </p>
            <div className="modal-confirm-actions">
              <button 
                onClick={handleCancelToggle} 
                className="btn-secondary"
                disabled={isToggling}
              >
                Annuler
              </button>
              <button 
                onClick={handleConfirmToggle} 
                className={`btn-${userToToggle?.is_active ? 'warning' : 'success'}`}
                disabled={isToggling}
              >
                {isToggling ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Traitement...
                  </>
                ) : (
                  userToToggle?.is_active ? "Désactiver" : "Activer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}