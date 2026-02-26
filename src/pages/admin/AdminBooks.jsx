import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, Pencil, Trash2, X, Check, Upload, Image as ImageIcon, 
  AlertCircle, Search, Filter, BookOpen, BookX, BookMarked, 
  ChevronDown, XCircle 
} from "lucide-react";
import { fetchLivres, createLivre, updateLivre, deleteLivre, deleteLivreImage } from "../../store/store";
import "../../css/AdminBooks.css";

export default function AdminBooks() {
  const dispatch = useDispatch();
  const { list: bookList = [], loading } = useSelector((state) => state.livres);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("titre");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Track selected files with unique IDs for removal
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { id, file, preview }
  
  // Track images to delete (for existing images in edit mode)
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    auteur: "",
    isbn: "",
    categorie: "",
    prix_achat: "",
    description: "",
    status: "available",
  });

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Get unique categories for filter dropdown and suggestions
  const categories = useMemo(() => {
    const cats = bookList
      .map(book => book.categorie)
      .filter(cat => cat && cat.trim() !== "");
    // Get unique categories (case-insensitive)
    const uniqueCats = [];
    const seen = new Set();
    
    cats.forEach(cat => {
      const lowerCat = cat.toLowerCase();
      if (!seen.has(lowerCat)) {
        seen.add(lowerCat);
        uniqueCats.push(cat);
      }
    });
    
    return uniqueCats.sort((a, b) => a.localeCompare(b));
  }, [bookList]);

  // Filter category suggestions based on input
  const categorySuggestions = useMemo(() => {
    if (!categoryInput.trim()) return [];
    
    const inputLower = categoryInput.toLowerCase();
    return categories
      .filter(cat => cat.toLowerCase().includes(inputLower))
      .slice(0, 5); // Limit to 5 suggestions
  }, [categories, categoryInput]);

  // Filter and search books
  const filteredBooks = useMemo(() => {
    return bookList.filter(book => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        book.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.auteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.categorie?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || book.status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || 
        book.categorie?.toLowerCase() === categoryFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      // Sorting
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";
      
      if (sortBy === "prix_achat") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [bookList, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Get current page books
  const currentBooks = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredBooks.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredBooks, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = bookList.length;
    const available = bookList.filter(book => book.status === "available").length;
    const outOfStock = bookList.filter(book => book.status === "out_of_stock").length;
    const uniqueCategories = categories.length;
    
    return {
      total,
      available,
      outOfStock,
      uniqueCategories
    };
  }, [bookList, categories]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      titre: "",
      auteur: "",
      isbn: "",
      categorie: "",
      prix_achat: "",
      description: "",
      status: "available",
    });
    setCategoryInput("");
    setSelectedFiles([]);
    setImagesToDelete([]);
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      titre: book.titre || "",
      auteur: book.auteur || "",
      isbn: book.isbn || "",
      categorie: book.categorie || "",
      prix_achat: book.prix_achat || "",
      description: book.description || "",
      status: book.status || "available",
    });
    setCategoryInput(book.categorie || "");
    setSelectedFiles([]);
    setImagesToDelete([]);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    dispatch(deleteLivre(id));
    setShowDeleteConfirm(null);
  };

  // Handle file selection with unique IDs
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (max 2MB)
    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`L'image ${file.name} est trop volumineuse. Maximum 2MB.`);
        return false;
      }
      return true;
    });

    // Create new file objects with unique IDs and preview URLs
    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9), // Unique ID
      file: file,
      preview: URL.createObjectURL(file)
    }));

    // Add new files to existing ones
    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Clear the input value to allow selecting the same file again
    e.target.value = '';
  };

  // Remove selected file by ID
  const removeSelectedFile = (fileId) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      
      // Revoke the object URL to free memory
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Remove all selected files
  const removeAllSelectedFiles = () => {
    // Revoke all object URLs
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setSelectedFiles([]);
  };

  // Handle deletion of existing image
  const handleExistingImageDelete = (imagePath) => {
    // Add to images to delete array
    setImagesToDelete(prev => [...prev, imagePath]);
  };

  // Restore deleted existing image (undo)
  const restoreExistingImage = (imagePath) => {
    setImagesToDelete(prev => prev.filter(img => img !== imagePath));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryInput(value);
    setForm({...form, categorie: value});
    setShowCategorySuggestions(true);
  };

  const selectCategory = (category) => {
    setCategoryInput(category);
    setForm({...form, categorie: category});
    setShowCategorySuggestions(false);
  };

  // Modified handleSave to handle deleted images
  const handleSave = async () => {
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    // Append new images from selectedFiles
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(fileObj => {
        formData.append('images[]', fileObj.file);
      });
    }

    // If in edit mode and there are images to delete, handle them
    if (editing && imagesToDelete.length > 0) {
      // For each image to delete, dispatch the delete action
      // You might want to handle this differently based on your API
      for (const imagePath of imagesToDelete) {
        try {
          await dispatch(deleteLivreImage({ id: editing.id, image: imagePath })).unwrap();
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    }

    try {
      if (editing) {
        formData.append('_method', 'PUT');
        await dispatch(updateLivre({ id: editing.id, formData })).unwrap();
      } else {
        await dispatch(createLivre(formData)).unwrap();
      }
      
      setShowModal(false);
      
      // Clean up previews
      removeAllSelectedFiles();
      setImagesToDelete([]);
      
      dispatch(fetchLivres());
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Une erreur est survenue lors de l\'enregistrement');
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("titre");
    setSortOrder("asc");
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Function to safely get images array from different formats
  const getImagesArray = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining object URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.category-input-container')) {
        setShowCategorySuggestions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get existing images excluding those marked for deletion
  const getExistingImages = () => {
    if (!editing || !editing.images) return [];
    
    const allImages = getImagesArray(editing.images);
    return allImages.filter(image => !imagesToDelete.includes(image));
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
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredBooks.length)} sur {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''}
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

  if (loading && !bookList.length) {
    return <div className="admin-loading">Chargement des livres...</div>;
  }

  return (
    <div className="admin-books">
      <div className="admin-header">
        <div>
          <h2>Gestion des Livres</h2>
          <p className="admin-subtitle">
            {filteredBooks.length > 0 
              ? `Affichage ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredBooks.length)} - ${Math.min(currentPage * itemsPerPage, filteredBooks.length)} sur ${filteredBooks.length} livre${filteredBooks.length !== 1 ? 's' : ''} (${bookList.length} total)`
              : `0 livre affiché sur ${bookList.length} total`
            }
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} />
          Ajouter un livre
        </button>
      </div>

      {/* Stats Cards */}
      <div className="books-stats-grid">
        <div className="book-stat-card">
          <div className="book-stat-icon total">
            <BookMarked size={24} />
          </div>
          <div className="book-stat-content">
            <span className="book-stat-label">Total livres</span>
            <span className="book-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="book-stat-card">
          <div className="book-stat-icon available">
            <BookOpen size={24} />
          </div>
          <div className="book-stat-content">
            <span className="book-stat-label">Disponibles</span>
            <span className="book-stat-value">{stats.available}</span>
          </div>
        </div>

        <div className="book-stat-card">
          <div className="book-stat-icon out-of-stock">
            <BookX size={24} />
          </div>
          <div className="book-stat-content">
            <span className="book-stat-label">En rupture</span>
            <span className="book-stat-value">{stats.outOfStock}</span>
          </div>
        </div>

        <div className="book-stat-card">
          <div className="book-stat-icon categories">
            <Filter size={24} />
          </div>
          <div className="book-stat-content">
            <span className="book-stat-label">Catégories</span>
            <span className="book-stat-value">{stats.uniqueCategories}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, ISBN ou catégorie..."
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
          <ChevronDown size={16} className={`chevron ${showFilters ? 'open' : ''}`} />
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
                <option value="available">Disponible</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </div>

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
              <label>Trier par</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="titre">Titre</option>
                <option value="auteur">Auteur</option>
                <option value="categorie">Catégorie</option>
                <option value="prix_achat">Prix</option>
                <option value="status">Statut</option>
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
      {filteredBooks.length === 0 && (
        <div className="no-results">
          <BookOpen size={48} />
          <h3>Aucun livre trouvé</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Books Table */}
      {filteredBooks.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Image</th>
                  <th onClick={() => {
                    setSortBy('titre');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="sortable">
                    Titre {sortBy === 'titre' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => {
                    setSortBy('auteur');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="sortable">
                    Auteur {sortBy === 'auteur' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>ISBN</th>
                  <th onClick={() => {
                    setSortBy('categorie');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="sortable">
                    Catégorie {sortBy === 'categorie' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '100px' }} onClick={() => {
                    setSortBy('prix_achat');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="sortable">
                    Prix {sortBy === 'prix_achat' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '100px' }} onClick={() => {
                    setSortBy('status');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="sortable">
                    Statut {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBooks.map((book) => {
                  const bookImages = getImagesArray(book.images);
                  return (
                    <tr key={book.id}>
                      <td>
                        {bookImages.length > 0 ? (
                          <img 
                            src={`https://fanta-lib-back-production.up.railway.app/storage/${bookImages[0]}`} 
                            alt={book.titre} 
                            className="book-thumb"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://dummyimage.com/40x52/cccccc/000000&text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="book-thumb-placeholder">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="book-tit">{book.titre || "-"}</td>
                      <td>{book.auteur || "-"}</td>
                      <td>{book.isbn || "-"}</td>
                      <td>{book.categorie || "-"}</td>
                      <td className="book-price">
                        {book.prix_achat ? Number(book.prix_achat).toFixed(2) : "0.00"} DH
                      </td>
                      <td>
                        <span className={`status-bad ${book.status === "available" ? "available" : "out_of_stock"}`}>
                          {book.status === "available" ? "Disponible" : "Rupture"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openEdit(book)} className="btn-icon edit" title="Modifier">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(book.id)} className="btn-icon delete" title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
              <p>Êtes-vous sûr de vouloir supprimer ce livre ?</p>
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
              <h3>{editing ? "Modifier le livre" : "Ajouter un livre"}</h3>
              <button onClick={() => {
                setShowModal(false);
                removeAllSelectedFiles(); // Clean up previews
                setImagesToDelete([]);
              }} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="titre">Titre <span className="required">*</span></label>
                  <input
                    id="titre"
                    type="text"
                    value={form.titre}
                    onChange={(e) => setForm({...form, titre: e.target.value})}
                    required
                    placeholder="Titre du livre"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="auteur">Auteur <span className="required">*</span></label>
                  <input
                    id="auteur"
                    type="text"
                    value={form.auteur}
                    onChange={(e) => setForm({...form, auteur: e.target.value})}
                    required
                    placeholder="Nom de l'auteur"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="isbn">ISBN</label>
                  <input
                    id="isbn"
                    type="text"
                    value={form.isbn}
                    onChange={(e) => setForm({...form, isbn: e.target.value})}
                    placeholder="ISBN (optionnel)"
                  />
                </div>

                <div className="form-group category-input-container">
                  <label htmlFor="categorie">Catégorie</label>
                  <div className="category-input-wrapper">
                    <input
                      id="categorie"
                      type="text"
                      value={categoryInput}
                      onChange={handleCategoryChange}
                      onFocus={() => setShowCategorySuggestions(true)}
                      placeholder="Catégorie (optionnel)"
                      autoComplete="off"
                    />
                    
                    {/* Category Suggestions Dropdown */}
                    {showCategorySuggestions && categorySuggestions.length > 0 && (
                      <div className="category-suggestions">
                        {categorySuggestions.map(category => (
                          <div
                            key={category}
                            className="category-suggestion-item"
                            onClick={() => selectCategory(category)}
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {categorySuggestions.length === 0 && categoryInput && (
                    <small className="category-hint">
                      Nouvelle catégorie : "{categoryInput}" sera créée
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="prix_achat">Prix d'achat (DH) <span className="required">*</span></label>
                  <input
                    id="prix_achat"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.prix_achat}
                    onChange={(e) => setForm({...form, prix_achat: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Statut</label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                  >
                    <option value="available">Disponible</option>
                    <option value="out_of_stock">Rupture de stock</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Description du livre (optionnel)"
                    rows="3"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="form-group images-section">
                <label>Images</label>
                
                {/* Existing images (when editing) */}
                {editing && (
                  <div className="existing-images">
                    <p className="section-label">Images existantes :</p>
                    <div className="image-grid">
                      {(() => {
                        const existingImages = getExistingImages();
                        return existingImages.length > 0 ? (
                          existingImages.map((image, index) => (
                            <div key={index} className="image-item">
                              <img 
                                src={`https://fanta-lib-back-production.up.railway.app/storage/${image}`} 
                                alt={`${editing.titre} - ${index + 1}`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://dummyimage.com/40x52/cccccc/000000&text=No+Image';
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => handleExistingImageDelete(image)}
                                className="btn-icon delete-image"
                                title="Supprimer cette image"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="no-images">
                            {imagesToDelete.length > 0 
                              ? "Toutes les images ont été marquées pour suppression"
                              : "Aucune image existante"}
                          </p>
                        );
                      })()}
                    </div>

                    {/* Images marked for deletion */}
                    {imagesToDelete.length > 0 && (
                      <div className="deleted-images">
                        <p className="section-label">Images marquées pour suppression :</p>
                        <div className="image-grid">
                          {imagesToDelete.map((image, index) => (
                            <div key={index} className="image-item deleted">
                              <img 
                                src={`https://fanta-lib-back-production.up.railway.app/storage/${image}`} 
                                alt={`À supprimer ${index + 1}`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://dummyimage.com/40x52/cccccc/000000&text=No+Image';
                                }}
                              />
                              <div className="deleted-overlay">
                                <span>À supprimer</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => restoreExistingImage(image)}
                                className="btn-icon restore-image"
                                title="Restaurer cette image"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* New image upload */}
                <div className="image-upload">
                  <label className="upload-area">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageChange}
                    />
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Cliquez pour ajouter des images</span>
                      <small>JPG, PNG (max 2MB)</small>
                    </div>
                  </label>
                </div>

                {/* Selected images preview with remove option */}
                {selectedFiles.length > 0 && (
                  <div className="image-previews">
                    <div className="previews-header">
                      <p className="section-label">Nouvelles images sélectionnées ({selectedFiles.length}) :</p>
                      <button 
                        type="button" 
                        onClick={removeAllSelectedFiles}
                        className="btn-remove-all"
                        title="Tout supprimer"
                      >
                        <Trash2 size={14} />
                        Tout supprimer
                      </button>
                    </div>
                    <div className="image-grid">
                      {selectedFiles.map((fileObj) => (
                        <div key={fileObj.id} className="image-item preview">
                          <img src={fileObj.preview} alt={`Preview`} />
                          <button 
                            type="button"
                            onClick={() => removeSelectedFile(fileObj.id)}
                            className="btn-icon delete-image"
                            title="Supprimer cette image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  removeAllSelectedFiles(); // Clean up previews
                  setImagesToDelete([]);
                }} className="btn-secondary">
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