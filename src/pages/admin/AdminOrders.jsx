import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Pencil, Trash2, Check, Search, XCircle, Filter, 
  X, Save, MapPin, Phone, User, Package, DollarSign,
  Map, FileText, Truck, UserCircle, Building, Plus,
  Loader, ChevronDown, BookOpen, Minus, Plus as PlusIcon,
  Eye
} from "lucide-react";
import axios from "axios";
import { 
  fetchCommandes, 
  updateCommande, 
  deleteCommande, 
  markCommandeAsDelivered,
  createCommande,
  fetchLivres
} from "../../store/store";
import "../../css/AdminOrders.css";

// Status labels and colors
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

// City Autocomplete Component
const CityAutocomplete = ({ value, onChange, onSelect, disabled = false }) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);

  // Fetch cities from Welivexpress API
  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        "https://fanta-lib-back-production.up.railway.app/api/welivexpress/listcities",
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      console.log("Cities API response:", response.data);
      
      let citiesData = [];
      if (Array.isArray(response.data)) {
        citiesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        citiesData = response.data.data;
      } else if (response.data.cities && Array.isArray(response.data.cities)) {
        citiesData = response.data.cities;
      }
      
      setCities(citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Impossible de charger les villes");
      // Fallback cities
      setCities([
        "Casablanca", "Rabat", "Fès", "Marrakech", "Agadir", "Tanger",
        "Meknès", "Oujda", "Kénitra", "Tétouan", "Safi", "Mohammédia",
        "El Jadida", "Béni Mellal", "Nador"
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (query.length >= 1) {
      const filtered = cities
        .filter(city => {
          const cityName = typeof city === 'string' ? city : city.name || city.city || city.label || '';
          return cityName.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, cities]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleSelectCity = (city) => {
    const cityName = typeof city === 'string' ? city : city.name || city.city || city.label || city;
    setQuery(cityName);
    onChange(cityName);
    if (onSelect) onSelect(cityName);
    setShowSuggestions(false);
  };

  return (
    <div className="city-autocomplete">
      <div className="autocomplete-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 1 && setSuggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Tapez pour rechercher une ville..."
          className="city-input"
          disabled={disabled}
        />
        {loading && <Loader size={16} className="autocomplete-spinner" />}
        {!loading && suggestions.length > 0 && (
          <ChevronDown size={16} className="autocomplete-arrow" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((city, index) => {
            const cityName = typeof city === 'string' ? city : city.name || city.city || city.label || city;
            return (
              <li
                key={index}
                onMouseDown={() => handleSelectCity(city)}
                className="suggestion-item"
              >
                <MapPin size={14} />
                {cityName}
              </li>
            );
          })}
        </ul>
      )}
      
      {error && <div className="city-error">{error}</div>}
    </div>
  );
};

// Book Selection Component
const BookSelector = ({ selectedBooks, onBooksChange }) => {
  const dispatch = useDispatch();
  const { list: booksList = [], loading: booksLoading } = useSelector((state) => state.livres);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  const filteredBooks = useMemo(() => {
    return booksList.filter(book => 
      book.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.auteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [booksList, searchTerm]);

  const addBook = (book) => {
    const existingBook = selectedBooks.find(b => b.id === book.id);
    if (existingBook) {
      onBooksChange(
        selectedBooks.map(b => 
          b.id === book.id 
            ? { ...b, quantity: b.quantity + 1, total: (b.quantity + 1) * b.prix_achat }
            : b
        )
      );
    } else {
      onBooksChange([
        ...selectedBooks,
        {
          id: book.id,
          titre: book.titre,
          auteur: book.auteur,
          prix_achat: book.prix_achat,
          quantity: 1,
          total: book.prix_achat
        }
      ]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateQuantity = (bookId, newQuantity) => {
    if (newQuantity < 1) {
      removeBook(bookId);
      return;
    }
    onBooksChange(
      selectedBooks.map(b => 
        b.id === bookId 
          ? { ...b, quantity: newQuantity, total: newQuantity * b.prix_achat }
          : b
      )
    );
  };

  const removeBook = (bookId) => {
    onBooksChange(selectedBooks.filter(b => b.id !== bookId));
  };

  const calculateSubtotal = () => {
    return selectedBooks.reduce((sum, book) => sum + book.total, 0);
  };

  return (
    <div className="book-selector">
      <div className="book-search-container">
        <div className="book-search-input-wrapper">
          <BookOpen size={16} className="book-search-icon" />
          <input
            type="text"
            placeholder="Rechercher un livre par titre, auteur ou ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="book-search-input"
          />
          {booksLoading && <Loader size={16} className="book-search-spinner" />}
        </div>
        
        {showDropdown && searchTerm && (
          <div className="book-dropdown">
            {filteredBooks.length > 0 ? (
              filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="book-dropdown-item"
                  onClick={() => addBook(book)}
                >
                  <div className="book-dropdown-info">
                    <span className="book-dropdown-title">{book.titre}</span>
                    <span className="book-dropdown-author">{book.auteur}</span>
                  </div>
                  <span className="book-dropdown-price">{book.prix_achat} MAD</span>
                </div>
              ))
            ) : (
              <div className="book-dropdown-empty">Aucun livre trouvé</div>
            )}
          </div>
        )}
      </div>

      {selectedBooks.length > 0 && (
        <div className="selected-books">
          <div className="selected-books-list">
            {selectedBooks.map(book => (
              <div key={book.id} className="selected-book-item">
                <div className="selected-book-info">
                  <span className="selected-book-title">{book.titre}</span>
                  <span className="selected-book-author">{book.auteur}</span>
                  <span className="selected-book-price">{book.prix_achat} MAD</span>
                </div>
                
                <div className="selected-book-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => updateQuantity(book.id, book.quantity - 1)}
                      className="quantity-btn"
                      disabled={book.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="quantity-value">{book.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(book.id, book.quantity + 1)}
                      className="quantity-btn"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>
                  <span className="selected-book-total">{book.total} MAD</span>
                  <button
                    type="button"
                    onClick={() => removeBook(book.id)}
                    className="remove-book-btn"
                    title="Retirer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="selected-books-summary">
            <span>Total livres:</span>
            <span>{calculateSubtotal()} MAD</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const livresCount = order.livres ? 
    (Array.isArray(order.livres) ? 
      order.livres.reduce((sum, book) => sum + (book.quantity || 1), 0) : 0) : 0;

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
                className="status-badge"
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
                      <td>{book.prix_achat || book.price || 0} MAD</td>
                      <td>{book.quantity || 1}</td>
                      <td>{(book.prix_achat || book.price || 0) * (book.quantity || 1)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-books">Aucun livre dans cette commande</p>
            )}
          </div>

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

          {order.parcel_note && (
            <div className="details-note">
              <label>Note:</label>
              <p>{order.parcel_note}</p>
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [addError, setAddError] = useState(null);
  
  // Track if total was manually edited
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(false);
  
  // Form state for update
  const [formData, setFormData] = useState({
    parcel_receiver: "",
    parcel_phone: "",
    parcel_city: "",
    parcel_address: "",
    parcel_price: "",
    parcel_note: "",
    parcel_open: 0,
    statut: "new"
  });

  // Form state for new order
  const [newOrderData, setNewOrderData] = useState({
    parcel_code: "",
    parcel_receiver: "",
    parcel_phone: "",
    parcel_city: "",
    parcel_address: "",
    parcel_price: 0,
    frais_livraison: 0,
    frais_packaging: 0,
    total: 0,
    profit: 0,
    parcel_note: "",
    parcel_open: 0,
    statut: "new",
    livres: [],
    date: new Date().toISOString().split('T')[0]
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
        statut: selectedOrder.statut || "new"
      });
    }
  }, [selectedOrder]);

  // Reset manual edit flag when books change
  useEffect(() => {
    setTotalManuallyEdited(false);
  }, [newOrderData.livres]);

  // Calculate books subtotal, total, and parcel_price
  useEffect(() => {
    // Calculate books subtotal (for reference)
    const booksSubtotal = (newOrderData.livres || []).reduce(
      (sum, book) => sum + (book.prix_achat * book.quantity), 0
    );
    
    const delivery = parseFloat(newOrderData.frais_livraison) || 0;
    const packaging = parseFloat(newOrderData.frais_packaging) || 0;
    
    // Determine total value
    let total;
    if (!totalManuallyEdited || newOrderData.livres.length === 0) {
      // Auto-calculate from books if not manually edited or no books
      total = booksSubtotal;
    } else {
      // Use manually entered value
      total = parseFloat(newOrderData.total) || 0;
    }
    
    // parcel_price is the total for Welivexpress (books + fees)
    const parcelPrice = total + delivery + packaging;
    
    // Profit calculation (total minus fees)
    const profit = total - (delivery + packaging);
    
    // Only update if values have changed to avoid infinite loops
    setNewOrderData(prev => {
      if (
        prev.total === total &&
        prev.parcel_price === parcelPrice &&
        prev.profit === profit
      ) {
        return prev;
      }
      return {
        ...prev,
        total: total,
        parcel_price: parcelPrice,
        profit: profit
      };
    });
  }, [
    newOrderData.livres, 
    newOrderData.frais_livraison, 
    newOrderData.frais_packaging,
    newOrderData.total,
    totalManuallyEdited
  ]);

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

  // Open details modal
  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  // Open update modal
  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateError(null);
    setShowUpdateModal(true);
  };

  // Close update modal
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
      statut: "new"
    });
    setUpdateError(null);
  };

  // Open add modal
  const openAddModal = () => {
    const newParcelCode = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setNewOrderData({
      parcel_code: newParcelCode,
      parcel_receiver: "",
      parcel_phone: "",
      parcel_city: "",
      parcel_address: "",
      parcel_price: 0,
      frais_livraison: 0,
      frais_packaging: 0,
      total: 0,
      profit: 0,
      parcel_note: "",
      parcel_open: 0,
      statut: "new",
      livres: [],
      date: new Date().toISOString().split('T')[0]
    });
    setTotalManuallyEdited(false);
    setAddError(null);
    setShowAddModal(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setNewOrderData({
      parcel_code: "",
      parcel_receiver: "",
      parcel_phone: "",
      parcel_city: "",
      parcel_address: "",
      parcel_price: 0,
      frais_livraison: 0,
      frais_packaging: 0,
      total: 0,
      profit: 0,
      parcel_note: "",
      parcel_open: 0,
      statut: "new",
      livres: [],
      date: new Date().toISOString().split('T')[0]
    });
    setTotalManuallyEdited(false);
    setAddError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleNewOrderChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Track manual edit for total field
    if (name === 'total') {
      setTotalManuallyEdited(true);
    }
    
    setNewOrderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // Handle books change
  const handleBooksChange = (books) => {
    setNewOrderData(prev => ({
      ...prev,
      livres: books
    }));
  };

  // Handle city selection for update form
  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      parcel_city: city
    }));
  };

  // Handle city selection for new order form
  const handleNewCitySelect = (city) => {
    setNewOrderData(prev => ({
      ...prev,
      parcel_city: city
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== selectedOrder[key] && formData[key] !== "") {
          updateData[key] = formData[key];
        }
      });

      if (formData.statut !== selectedOrder.statut) {
        updateData.statut = formData.statut;
      }

      if (Object.keys(updateData).length === 0) {
        closeUpdateModal();
        return;
      }

      console.log("Updating order with data:", updateData);
      
      const result = await dispatch(updateCommande({ 
        id: selectedOrder.id, 
        ...updateData 
      })).unwrap();

      console.log("Update successful:", result);
      
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newOrderData.parcel_receiver || !newOrderData.parcel_city) {
      setAddError("Veuillez remplir tous les champs obligatoires (client, ville)");
      return;
    }

    if (newOrderData.livres.length === 0) {
      setAddError("Veuillez sélectionner au moins un livre");
      return;
    }

    // Calculate values for submission
    const delivery = parseFloat(newOrderData.frais_livraison) || 0;
    const packaging = parseFloat(newOrderData.frais_packaging) || 0;
    const total = parseFloat(newOrderData.total) || 0;
    const parcelPrice = total + delivery + packaging;
    const profit = total - (delivery + packaging);

    // Format livres with all necessary information
    const formattedLivres = newOrderData.livres.map(book => ({
      id: book.id,
      titre: book.titre,
      auteur: book.auteur || '',
      quantity: parseInt(book.quantity),
      price: parseFloat(book.prix_achat),
      total: parseFloat(book.prix_achat) * parseInt(book.quantity)
    }));

    // Prepare order data for database
    const orderToCreate = {
      parcel_code: newOrderData.parcel_code,
      parcel_receiver: newOrderData.parcel_receiver,
      parcel_phone: newOrderData.parcel_phone || "",
      parcel_city: newOrderData.parcel_city,
      parcel_address: newOrderData.parcel_address || "",
      parcel_price: parseFloat(parcelPrice.toFixed(2)),
      frais_livraison: parseFloat(delivery.toFixed(2)),
      frais_packaging: parseFloat(packaging.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      parcel_note: newOrderData.parcel_note || "",
      parcel_open: newOrderData.parcel_open ? 1 : 0,
      statut: newOrderData.statut || "new",
      livres: formattedLivres,
      date: newOrderData.date
    };

    console.log("Creating new order with data:", orderToCreate);

    setAddLoading(true);
    setAddError(null);

    try {
      const result = await dispatch(createCommande(orderToCreate)).unwrap();
      console.log("Create successful:", result);
      await dispatch(fetchCommandes());
      closeAddModal();
    } catch (error) {
      console.error("Create failed:", error);
      setAddError(
        error?.message || 
        "Erreur lors de la création de la commande. Veuillez réessayer."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orderList.filter(order => {
      const matchesSearch = searchTerm === "" || 
        order.parcel_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_receiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.statut === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [orderList, searchTerm, statusFilter]);

  // Get current page orders
  const currentOrders = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredOrders, currentPage, itemsPerPage]);

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
        
        <button onClick={openAddModal} className="btn-add-order">
          <Plus size={20} />
          Nouvelle commande
        </button>
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
                  <th>Statut</th>
                  <th>Prix colis</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => {
                  return (
                    <tr key={order.id}>
                      <td className="order-code">{order.parcel_code || "-"}</td>
                      <td className="order-client">{order.parcel_receiver || "-"}</td>
                      <td>{order.parcel_phone || "-"}</td>
                      <td>{order.parcel_city || "-"}</td>
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
                      <td className="order-price">{order.parcel_price ? `${order.parcel_price} MAD` : "-"}</td>
                      <td>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => openDetailsModal(order)}
                            className="btn-icon view"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <Pagination />
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={closeDetailsModal} 
        />
      )}

      {/* ADD MODAL - Without sections */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content add-order-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle commande</h3>
              <button onClick={closeAddModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {addError && (
                <div className="modal-error">
                  <span className="error-icon">⚠️</span>
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="compact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Code colis</label>
                    <input
                      type="text"
                      name="parcel_code"
                      value={newOrderData.parcel_code}
                      onChange={handleNewOrderChange}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newOrderData.date}
                      onChange={handleNewOrderChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Client</label>
                    <input
                      type="text"
                      name="parcel_receiver"
                      value={newOrderData.parcel_receiver}
                      onChange={handleNewOrderChange}
                      placeholder="Nom du client"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      name="parcel_phone"
                      value={newOrderData.parcel_phone}
                      onChange={handleNewOrderChange}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ville</label>
                    <CityAutocomplete
                      value={newOrderData.parcel_city}
                      onChange={(value) => setNewOrderData(prev => ({ ...prev, parcel_city: value }))}
                      onSelect={handleNewCitySelect}
                    />
                  </div>

                  <div className="form-group">
                    <label>Adresse</label>
                    <input
                      type="text"
                      name="parcel_address"
                      value={newOrderData.parcel_address}
                      onChange={handleNewOrderChange}
                      placeholder="Adresse"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Livres commandés</label>
                  <BookSelector 
                    selectedBooks={newOrderData.livres}
                    onBooksChange={handleBooksChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Frais livraison (MAD)</label>
                    <input
                      type="number"
                      name="frais_livraison"
                      value={newOrderData.frais_livraison}
                      onChange={handleNewOrderChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Frais packaging (MAD)</label>
                    <input
                      type="number"
                      name="frais_packaging"
                      value={newOrderData.frais_packaging}
                      onChange={handleNewOrderChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      name="statut"
                      value={newOrderData.statut}
                      onChange={handleNewOrderChange}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Total livres (MAD)</label>
                    <input
                      type="number"
                      name="total"
                      value={newOrderData.total}
                      onChange={handleNewOrderChange}
                      min="0"
                      step="0.01"
                      className={totalManuallyEdited ? "manual-edit-input" : ""}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prix colis (MAD)</label>
                    <input
                      type="number"
                      name="parcel_price"
                      value={newOrderData.parcel_price}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Profit (MAD)</label>
                    <input
                      type="number"
                      name="profit"
                      value={newOrderData.profit}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Note</label>
                  <textarea
                    name="parcel_note"
                    value={newOrderData.parcel_note}
                    onChange={handleNewOrderChange}
                    placeholder="Notes ou instructions spéciales"
                    rows="2"
                  />
                </div>

                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="parcel_open"
                    name="parcel_open"
                    checked={newOrderData.parcel_open === 1}
                    onChange={handleNewOrderChange}
                  />
                  <label htmlFor="parcel_open">Colis ouvert / vérifié</label>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={closeAddModal}
                className="btn-secondary"
                disabled={addLoading}
              >
                Annuler
              </button>
              <button 
                type="submit"
                onClick={handleAddSubmit}
                className="btn-primary"
                disabled={addLoading}
              >
                {addLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Création...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL - Without sections */}
      {showUpdateModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal-content update-order-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier la commande #{selectedOrder.parcel_code}</h3>
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

              <form onSubmit={handleUpdateSubmit} className="compact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Client</label>
                    <input
                      type="text"
                      name="parcel_receiver"
                      value={formData.parcel_receiver}
                      onChange={handleInputChange}
                      placeholder="Nom du client"
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="text"
                      name="parcel_phone"
                      value={formData.parcel_phone}
                      onChange={handleInputChange}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ville</label>
                    <CityAutocomplete
                      value={formData.parcel_city}
                      onChange={(value) => setFormData(prev => ({ ...prev, parcel_city: value }))}
                      onSelect={handleCitySelect}
                    />
                  </div>

                  <div className="form-group">
                    <label>Adresse</label>
                    <input
                      type="text"
                      name="parcel_address"
                      value={formData.parcel_address}
                      onChange={handleInputChange}
                      placeholder="Adresse"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Prix colis (MAD)</label>
                    <input
                      type="number"
                      name="parcel_price"
                      value={formData.parcel_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      name="statut"
                      value={formData.statut}
                      onChange={handleInputChange}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Note</label>
                  <textarea
                    name="parcel_note"
                    value={formData.parcel_note}
                    onChange={handleInputChange}
                    placeholder="Notes ou instructions spéciales"
                    rows="2"
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
                  <label htmlFor="parcel_open">Colis ouvert / vérifié</label>
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