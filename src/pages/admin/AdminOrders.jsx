import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Pencil, Trash2, Check, Search, XCircle, Filter, 
  X, Save, MapPin, Phone, User, Package, DollarSign,
  Map, FileText, Truck, UserCircle, Building, Plus,
  Loader, ChevronDown
} from "lucide-react";
import axios from "axios";
import { 
  fetchCommandes, 
  updateCommande, 
  deleteCommande, 
  markCommandeAsDelivered,
  createCommande
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

// City Autocomplete Component with delivery fees
const CityAutocomplete = ({ value, onChange, onSelect, disabled = false }) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);

  // Update query when value prop changes (for update form)
  useEffect(() => {
    if (value !== query) {
      setQuery(value || "");
    }
  }, [value]);

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
      
      // Transform data to include delivery fees if not present
      citiesData = citiesData.map(city => {
        if (typeof city === 'string') {
          return {
            name: city,
            delivery_fee: getDefaultDeliveryFee(city)
          };
        }
        return city;
      });
      
      setCities(citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Impossible de charger les villes");
      // Fallback cities with delivery fees
      setCities([
        { name: "Casablanca", delivery_fee: 25 },
        { name: "Rabat", delivery_fee: 30 },
        { name: "Fès", delivery_fee: 35 },
        { name: "Marrakech", delivery_fee: 40 },
        { name: "Agadir", delivery_fee: 45 },
        { name: "Tanger", delivery_fee: 35 },
        { name: "Meknès", delivery_fee: 35 },
        { name: "Oujda", delivery_fee: 45 },
        { name: "Kénitra", delivery_fee: 30 },
        { name: "Tétouan", delivery_fee: 35 },
        { name: "Safi", delivery_fee: 35 },
        { name: "Mohammédia", delivery_fee: 25 },
        { name: "El Jadida", delivery_fee: 30 },
        { name: "Béni Mellal", delivery_fee: 35 },
        { name: "Nador", delivery_fee: 45 }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to get default delivery fee based on city name
  const getDefaultDeliveryFee = (cityName) => {
    const cityFees = {
      'casablanca': 25,
      'rabat': 30,
      'fès': 35,
      'marrakech': 40,
      'agadir': 45,
      'tanger': 35,
      'meknès': 35,
      'oujda': 45,
      'kénitra': 30,
      'tétouan': 35,
      'safi': 35,
      'mohammédia': 25,
      'el jadida': 30,
      'béni mellal': 35,
      'nador': 45
    };
    
    const lowerCity = cityName.toLowerCase();
    for (const [key, fee] of Object.entries(cityFees)) {
      if (lowerCity.includes(key)) {
        return fee;
      }
    }
    return 30; // Default fee
  };

  // Load cities on component mount
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Filter cities based on query
  useEffect(() => {
    if (query.length >= 1) {
      const filtered = cities
        .filter(city => {
          const cityName = city.name || city.city || city.label || '';
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
    const cityName = city.name || city.city || city.label || city;
    const deliveryFee = city.delivery_fee || city.frais_livraison || getDefaultDeliveryFee(cityName);
    
    setQuery(cityName);
    onChange(cityName);
    if (onSelect) onSelect(cityName, deliveryFee);
    setShowSuggestions(false);
  };

  return (
    <div className="city-autocomplete">
      <div className="autocomplete-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 1 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
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
            const cityName = city.name || city.city || city.label || city;
            const deliveryFee = city.delivery_fee || city.frais_livraison || getDefaultDeliveryFee(cityName);
            
            return (
              <li
                key={index}
                onMouseDown={() => handleSelectCity(city)}
                className="suggestion-item"
              >
                <MapPin size={14} />
                <span className="city-name">{cityName}</span>
                {deliveryFee > 0 && (
                  <span className="delivery-fee-badge">{deliveryFee} MAD</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      
      {error && <div className="city-error">{error}</div>}
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [addError, setAddError] = useState(null);
  
  // Form state for update - WITH ALL FIELDS
  const [formData, setFormData] = useState({
    parcel_receiver: "",
    parcel_phone: "",
    parcel_city: "",
    parcel_address: "",
    parcel_price: "",
    frais_livraison: "",
    frais_packaging: "",
    parcel_note: "",
    parcel_open: 0,
    parcel_livreur_sent: "",
    parcel_livreurname_sent: "",
    statut: "new"
  });

  // Form state for new order
  const [newOrderData, setNewOrderData] = useState({
    parcel_code: "",
    parcel_receiver: "",
    parcel_phone: "",
    parcel_city: "",
    parcel_address: "",
    parcel_price: "",
    frais_livraison: 0,
    frais_packaging: 0,
    total: 0,
    profit: 0,
    parcel_note: "",
    parcel_open: 0,
    parcel_livreur_sent: "",
    parcel_livreurname_sent: "",
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

  // Update form data when selected order changes - FIXED TO HANDLE ALL FIELDS
  useEffect(() => {
    if (selectedOrder) {
      console.log("Setting update form data with:", selectedOrder);
      setFormData({
        parcel_receiver: selectedOrder.parcel_receiver || "",
        parcel_phone: selectedOrder.parcel_phone || "",
        parcel_city: selectedOrder.parcel_city || "",
        parcel_address: selectedOrder.parcel_address || "",
        parcel_price: selectedOrder.parcel_price?.toString() || "",
        frais_livraison: selectedOrder.frais_livraison?.toString() || "",
        frais_packaging: selectedOrder.frais_packaging?.toString() || "",
        parcel_note: selectedOrder.parcel_note || "",
        parcel_open: selectedOrder.parcel_open ? 1 : 0,
        parcel_livreur_sent: selectedOrder.parcel_livreur_sent || "",
        parcel_livreurname_sent: selectedOrder.parcel_livreurname_sent || "",
        statut: selectedOrder.statut || "new"
      });
    }
  }, [selectedOrder]);

  // Calculate total and profit when relevant fields change
  useEffect(() => {
    const price = parseFloat(newOrderData.parcel_price) || 0;
    const delivery = parseFloat(newOrderData.frais_livraison) || 0;
    const packaging = parseFloat(newOrderData.frais_packaging) || 0;
    
    const total = price + delivery + packaging;
    const profit = price - (delivery + packaging);
    
    setNewOrderData(prev => ({
      ...prev,
      total: parseFloat(total.toFixed(2)),
      profit: parseFloat(profit.toFixed(2))
    }));
  }, [newOrderData.parcel_price, newOrderData.frais_livraison, newOrderData.frais_packaging]);

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
      frais_livraison: "",
      frais_packaging: "",
      parcel_note: "",
      parcel_open: 0,
      parcel_livreur_sent: "",
      parcel_livreurname_sent: "",
      statut: "new"
    });
    setUpdateError(null);
  };

  // Open add modal
  const openAddModal = () => {
    const newParcelCode = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setNewOrderData({
      ...newOrderData,
      parcel_code: newParcelCode,
      date: new Date().toISOString().split('T')[0],
      frais_livraison: 0,
      frais_packaging: 0,
      total: 0,
      profit: 0
    });
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
      parcel_price: "",
      frais_livraison: 0,
      frais_packaging: 0,
      total: 0,
      profit: 0,
      parcel_note: "",
      parcel_open: 0,
      parcel_livreur_sent: "",
      parcel_livreurname_sent: "",
      statut: "new",
      livres: [],
      date: new Date().toISOString().split('T')[0]
    });
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
    setNewOrderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // Handle city selection for update form
  const handleCitySelect = (city, deliveryFee) => {
    setFormData(prev => ({
      ...prev,
      parcel_city: city,
      frais_livraison: deliveryFee?.toString() || prev.frais_livraison
    }));
  };

  // Handle city selection for new order form
  const handleNewCitySelect = (city, deliveryFee) => {
    console.log("City selected:", city, "with fee:", deliveryFee);
    setNewOrderData(prev => ({
      ...prev,
      parcel_city: city,
      frais_livraison: deliveryFee || 0
    }));
  };

  // FIXED: handleUpdateSubmit with proper type handling
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdateLoading(true);
    setUpdateError(null);

    try {
      // Prepare the data for the API with proper type handling
      const updatePayload = {};

      // Helper function to safely compare and add fields
      const addIfChanged = (fieldName, value, originalValue, transformFn = (v) => v) => {
        // Handle null/undefined/empty string cases
        const processedValue = value === "" || value === null || value === undefined ? null : value;
        const processedOriginal = originalValue === "" || originalValue === null || originalValue === undefined ? null : originalValue;
        
        // Compare and add if different
        if (JSON.stringify(processedValue) !== JSON.stringify(processedOriginal)) {
          updatePayload[fieldName] = transformFn(processedValue);
        }
      };

      // String fields - ensure they're strings or null
      addIfChanged('parcel_receiver', formData.parcel_receiver, selectedOrder.parcel_receiver, v => v === null ? null : String(v));
      addIfChanged('parcel_phone', formData.parcel_phone, selectedOrder.parcel_phone, v => v === null ? null : String(v));
      addIfChanged('parcel_city', formData.parcel_city, selectedOrder.parcel_city, v => v === null ? null : String(v));
      addIfChanged('parcel_address', formData.parcel_address, selectedOrder.parcel_address, v => v === null ? null : String(v));
      addIfChanged('parcel_note', formData.parcel_note, selectedOrder.parcel_note, v => v === null ? null : String(v));
      addIfChanged('parcel_livreur_sent', formData.parcel_livreur_sent, selectedOrder.parcel_livreur_sent, v => v === null ? null : String(v));
      addIfChanged('parcel_livreurname_sent', formData.parcel_livreurname_sent, selectedOrder.parcel_livreurname_sent, v => v === null ? null : String(v));
      addIfChanged('statut', formData.statut, selectedOrder.statut, v => v === null ? null : String(v));

      // Numeric fields - ensure they're numbers or null
      addIfChanged('parcel_price', formData.parcel_price, selectedOrder.parcel_price, v => v === null ? null : parseFloat(v) || 0);
      addIfChanged('frais_livraison', formData.frais_livraison, selectedOrder.frais_livraison, v => v === null ? null : parseFloat(v) || 0);
      addIfChanged('frais_packaging', formData.frais_packaging, selectedOrder.frais_packaging, v => v === null ? null : parseFloat(v) || 0);

      // Boolean/Integer field - ensure it's 0 or 1
      addIfChanged('parcel_open', formData.parcel_open, selectedOrder.parcel_open, v => v ? 1 : 0);

      // If no changes were detected, close the modal
      if (Object.keys(updatePayload).length === 0) {
        console.log("No changes detected, closing modal.");
        closeUpdateModal();
        return;
      }

      console.log("📤 Sending update payload to backend:", updatePayload);
      
      const result = await dispatch(updateCommande({ 
        id: selectedOrder.id, 
        ...updatePayload 
      })).unwrap();

      console.log("✅ Update successful. Full response:", result);
      
      // Check if the backend reported any issues with the Welivexpress update
      if (result.welivexpress_response) {
          console.log("Welivexpress response:", result.welivexpress_response);
          if (result.welivexpress_response.success === false) {
              setUpdateError(`Mise à jour locale OK, mais Welivexpress a répondu: ${result.welivexpress_response.message || 'Erreur'}`);
          }
      }
      
      await dispatch(fetchCommandes());
      closeUpdateModal();
      
    } catch (error) {
      console.error("❌ Update process failed:", error);
      const errorMessage = error?.message || 
                           error?.data?.message || 
                           "Erreur lors de la mise à jour. Veuillez réessayer.";
      setUpdateError(errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!newOrderData.parcel_receiver || !newOrderData.parcel_city || !newOrderData.parcel_price) {
      setAddError("Veuillez remplir tous les champs obligatoires (client, ville, prix)");
      return;
    }

    const orderToCreate = {
      ...newOrderData,
      parcel_price: parseFloat(newOrderData.parcel_price) || 0,
      frais_livraison: parseFloat(newOrderData.frais_livraison) || 0,
      frais_packaging: parseFloat(newOrderData.frais_packaging) || 0,
      total: parseFloat(newOrderData.total) || 0,
      profit: parseFloat(newOrderData.profit) || 0,
      parcel_open: newOrderData.parcel_open ? 1 : 0,
      livres: newOrderData.livres || []
    };

    setAddLoading(true);
    setAddError(null);

    try {
      console.log("Creating new order with data:", orderToCreate);
      
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
                  <th>Adresse</th>
                  <th>Prix</th>
                  <th>Frais</th>
                  <th>Total</th>
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
                    <td>{(order.frais_livraison || 0) + (order.frais_packaging || 0)} MAD</td>
                    <td className="order-total">{order.total ? `${order.total} MAD` : "-"}</td>
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
          
          <Pagination />
        </>
      )}

      {/* ADD MODAL */}
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

              <form onSubmit={handleAddSubmit} className="update-form">
                <div className="form-section">
                  <h4>
                    <Package size={16} />
                    Informations de la commande
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_code">
                        Code colis <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="parcel_code"
                        name="parcel_code"
                        value={newOrderData.parcel_code}
                        onChange={handleNewOrderChange}
                        placeholder="Code unique"
                        readOnly
                        className="readonly-input"
                      />
                      <small className="field-hint">Généré automatiquement</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="date">
                        Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={newOrderData.date}
                        onChange={handleNewOrderChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <User size={16} />
                    Informations client <span className="required">*</span>
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
                        value={newOrderData.parcel_receiver}
                        onChange={handleNewOrderChange}
                        placeholder="Nom du client"
                        required
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
                        value={newOrderData.parcel_phone}
                        onChange={handleNewOrderChange}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <Map size={16} />
                    Adresse de livraison <span className="required">*</span>
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_city">
                        <Building size={14} />
                        Ville
                      </label>
                      <CityAutocomplete
                        value={newOrderData.parcel_city}
                        onChange={(value) => setNewOrderData(prev => ({ ...prev, parcel_city: value }))}
                        onSelect={handleNewCitySelect}
                      />
                      <small className="field-hint">La sélection d'une ville mettra à jour les frais de livraison</small>
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="parcel_address">
                        <MapPin size={14} />
                        Adresse complète
                      </label>
                      <textarea
                        id="parcel_address"
                        name="parcel_address"
                        value={newOrderData.parcel_address}
                        onChange={handleNewOrderChange}
                        placeholder="Adresse détaillée"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>
                    <DollarSign size={16} />
                    Informations financières <span className="required">*</span>
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="parcel_price">
                        Prix du colis (MAD)
                      </label>
                      <input
                        type="number"
                        id="parcel_price"
                        name="parcel_price"
                        value={newOrderData.parcel_price}
                        onChange={handleNewOrderChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="frais_livraison">
                        Frais de livraison (MAD)
                      </label>
                      <input
                        type="number"
                        id="frais_livraison"
                        name="frais_livraison"
                        value={newOrderData.frais_livraison}
                        onChange={handleNewOrderChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className={newOrderData.frais_livraison > 0 ? "auto-filled" : ""}
                      />
                      {newOrderData.frais_livraison > 0 && (
                        <small className="field-hint success">Frais automatiques appliqués</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="frais_packaging">
                        Frais de packaging (MAD)
                      </label>
                      <input
                        type="number"
                        id="frais_packaging"
                        name="frais_packaging"
                        value={newOrderData.frais_packaging}
                        onChange={handleNewOrderChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label htmlFor="total">
                        Total (MAD)
                      </label>
                      <input
                        type="number"
                        id="total"
                        name="total"
                        value={newOrderData.total}
                        readOnly
                        className="readonly-input total-field"
                      />
                      <small className="field-hint">Calculé automatiquement</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="profit">
                        Profit (MAD)
                      </label>
                      <input
                        type="number"
                        id="profit"
                        name="profit"
                        value={newOrderData.profit}
                        readOnly
                        className={`readonly-input ${newOrderData.profit >= 0 ? 'profit-positive' : 'profit-negative'}`}
                      />
                      <small className="field-hint">Calculé automatiquement</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="statut">
                        Statut
                      </label>
                      <select
                        id="statut"
                        name="statut"
                        value={newOrderData.statut}
                        onChange={handleNewOrderChange}
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
                        value={newOrderData.parcel_livreur_sent}
                        onChange={handleNewOrderChange}
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
                        value={newOrderData.parcel_livreurname_sent}
                        onChange={handleNewOrderChange}
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
                      value={newOrderData.parcel_note}
                      onChange={handleNewOrderChange}
                      placeholder="Notes ou instructions spéciales"
                      rows="3"
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
                    Créer la commande
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL - FIXED WITH ALL FIELDS */}
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
                      <CityAutocomplete
                        value={formData.parcel_city}
                        onChange={(value) => setFormData(prev => ({ ...prev, parcel_city: value }))}
                        onSelect={handleCitySelect}
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
                      <label htmlFor="frais_livraison">
                        Frais de livraison (MAD)
                      </label>
                      <input
                        type="number"
                        id="frais_livraison"
                        name="frais_livraison"
                        value={formData.frais_livraison}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="frais_packaging">
                        Frais de packaging (MAD)
                      </label>
                      <input
                        type="number"
                        id="frais_packaging"
                        name="frais_packaging"
                        value={formData.frais_packaging}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '1rem' }}>
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