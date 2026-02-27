import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Plus, Pencil, Trash2, X, Check, Upload, Image as ImageIcon, 
  AlertCircle, Search, Filter, BookOpen, BookX, BookMarked, 
  ChevronDown, XCircle, Loader 
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
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  // Track removed images
  const [removedImages, setRemovedImages] = useState([]);
  
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
      .slice(0, 5);
  }, [categories, categoryInput]);

  // Filter and search books
  const filteredBooks = useMemo(() => {
    return bookList.filter(book => {
      const matchesSearch = searchTerm === "" || 
        book.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.auteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.categorie?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || book.status === statusFilter;
      
      const matchesCategory = categoryFilter === "all" || 
        book.categorie?.toLowerCase() === categoryFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
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

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = bookList.length;
    const available = bookList.filter(book => book.status === "available").length;
    const outOfStock = bookList.filter(book => book.status === "out_of_stock").length;
    const uniqueCategories = categories.length;
    
    return { total, available, outOfStock, uniqueCategories };
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
    setSelectedImages([]);
    setImagePreviews([]);
    setRemovedImages([]);
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
    setSelectedImages([]);
    setImagePreviews([]);
    setRemovedImages([]); // Reset removed images
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    dispatch(deleteLivre(id));
    setShowDeleteConfirm(null);
  };

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
    
    setSelectedImages(validFiles);
    
    // Create preview URLs
    const previews = validFiles.map(file => URL.createObjectURL(file));
    
    // Clean up previous previews
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews(previews);
  };

  // Handle removing a new image preview (not yet uploaded)
  const handleRemoveNewImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    // Remove the image from selectedImages and previews
    const updatedSelectedImages = [...selectedImages];
    updatedSelectedImages.splice(index, 1);
    setSelectedImages(updatedSelectedImages);
    
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  // Handle removing an existing image (mark for deletion)
  const handleRemoveExistingImage = (imagePath) => {
    // Add to removed images list
    setRemovedImages(prev => [...prev, imagePath]);
    
    // Update the editing book's images in the UI (remove from display)
    if (editing && editing.images) {
      const updatedImages = editing.images.filter(img => img !== imagePath);
      setEditing({
        ...editing,
        images: updatedImages
      });
    }
  };

  // Handle permanent deletion from server (with confirmation)
  const handleDeleteImage = (imagePath) => {
    if (!editing || !editing.id) return;
    
    setShowImageDeleteConfirm({
      bookId: editing.id,
      imagePath: imagePath,
      bookTitle: editing.titre
    });
  };

  const confirmDeleteImage = async () => {
    if (!showImageDeleteConfirm) return;
    
    setDeletingImage(true);
    
    try {
      const result = await dispatch(deleteLivreImage({ 
        id: showImageDeleteConfirm.bookId, 
        image: showImageDeleteConfirm.imagePath 
      })).unwrap();
      
      // Update the editing book with the new images from response
      if (result && result.data) {
        setEditing(result.data);
      }
      
      // Refresh the book list
      dispatch(fetchLivres());
      
      // Show success message
      alert('Image supprimée avec succès');
      
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Erreur lors de la suppression de l\'image');
    } finally {
      setDeletingImage(false);
      setShowImageDeleteConfirm(null);
    }
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

  const handleSave = async () => {
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
        formData.append(key, form[key]);
      }
    });

    // Append new images if selected
    if (selectedImages.length > 0) {
      selectedImages.forEach(image => {
        formData.append('images[]', image);
      });
    }

    // Add existing image references for editing
    if (editing) {
      const existingImages = getImagesArray(editing.images || []);
      
      // Only append if there are existing images
      if (existingImages.length > 0) {
        formData.append('existing_images', JSON.stringify(existingImages));
      }
      
      // Add removed images to be deleted from server
      if (removedImages.length > 0) {
        formData.append('removed_images', JSON.stringify(removedImages));
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
      dispatch(fetchLivres());
      
      // Clean up previews
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

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
                        <span className={`status-badge ${book.status === "available" ? "available" : "out_of_stock"}`}>
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

      {/* Image Delete Confirmation Modal */}
      {showImageDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Confirmer la suppression</h3>
              <button onClick={() => setShowImageDeleteConfirm(null)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="delete-content">
              <AlertCircle size={48} className="delete-icon" />
              <p>Êtes-vous sûr de vouloir supprimer cette image ?</p>
              <p className="delete-warning">Cette action est irréversible.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowImageDeleteConfirm(null)} className="btn-secondary" disabled={deletingImage}>
                Annuler
              </button>
              <button onClick={confirmDeleteImage} className="btn-delete" disabled={deletingImage}>
                {deletingImage ? (
                  <>
                    <Loader size={16} className="spin" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>{editing ? "Modifier le livre" : "Ajouter un livre"}</h3>
              <button onClick={() => {
                setShowModal(false);
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
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
                {editing && editing.images && (
                  <div className="existing-images">
                    <p className="section-label">Images existantes :</p>
                    <div className="image-grid">
                      {(() => {
                        const existingImages = getImagesArray(editing.images);
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
                              {/* Two buttons for existing images */}
                              <div className="image-actions">
                                {/* Remove button (mark for deletion) */}
                                {/* Remove button (mark for deletion) */}
<button 
  type="button"
  onClick={() => handleRemoveExistingImage(image)}
  className="btn-icon remove-image-btn"
  title="Retirer de la liste (sera supprimé lors de l'enregistrement)"
  disabled={deletingImage}
  style={{
    backgroundColor: '#f50b0b',
    color: 'white',
    border: '2px solid white',
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 1,
    transform: 'scale(1)'
  }}
>
  <Trash2  size={24} style={{ width: '100%', height: '100%' }} />
</button>
                                
                                
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-images">Aucune image</p>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Show removed images count when editing */}
                {editing && removedImages.length > 0 && (
                  <div className="removed-images-notification">
                    <p className="text-sm text-red-700 font-medium">
                      <span className="font-bold">{removedImages.length}</span> image{removedImages.length !== 1 ? 's' : ''} marquée{removedImages.length !== 1 ? 's' : ''} pour suppression
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Ces images seront supprimées du serveur lorsque vous enregistrerez les modifications.
                    </p>
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
                      disabled={deletingImage}
                    />
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Cliquez pour ajouter des images</span>
                      <small>JPG, PNG (max 2MB)</small>
                    </div>
                  </label>
                </div>

                {/* Image previews for new images */}
                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    <p className="section-label">Nouvelles images :</p>
                    <div className="image-grid">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="image-item preview">
                          <img src={preview} alt={`Preview ${index + 1}`} />
                          {/* Remove button for new images */}
                          <button 
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="btn-icon remove-image-btn"
                            title="Retirer cette image"
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
                  imagePreviews.forEach(url => URL.revokeObjectURL(url));
                }} className="btn-secondary" disabled={deletingImage}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={deletingImage}>
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