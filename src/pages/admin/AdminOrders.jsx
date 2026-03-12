import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Pencil, Trash2, Check, Search, XCircle, Filter, 
  X, Save, MapPin, Phone, User, Package, DollarSign,
  Map, FileText, Truck, UserCircle, Building, Plus,
  Loader, ChevronDown, BookOpen, Minus, Plus as PlusIcon,
  Eye, RefreshCw, AlertCircle, CheckCircle, Box, Layers,
  Clock, CreditCard, Calendar, PackageCheck, PackageX,
  Info, Copy, Bell, Webhook, Edit, ArrowLeft
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

// Helper function to generate code with city prefix, month, year, random numbers and letters
const generateOrderCode = (cityName) => {
  // Get first 3 letters of city (uppercase) - clean the city name first
  let cityPrefix = 'CITY'; // Default
  
  if (cityName && typeof cityName === 'string' && cityName.trim() !== '') {
    // Remove any special characters and take first 3 letters
    const cleanCity = cityName.trim().replace(/[^a-zA-Z\u0600-\u06FF]/g, '');
    if (cleanCity.length >= 3) {
      cityPrefix = cleanCity.substring(0, 3).toUpperCase();
    } else if (cleanCity.length > 0) {
      // If city name is less than 3 chars, pad with X
      cityPrefix = cleanCity.toUpperCase().padEnd(3, 'X');
    }
  }
  
  // Get current month (2 digits)
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Get current year (last 2 digits)
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Generate 4 random numbers (1000-9999)
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  
  // Generate 2 random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array(2).fill()
    .map(() => letters.charAt(Math.floor(Math.random() * letters.length)))
    .join('');
  
  // Combine all parts: CITYMMYY-####LL
  const generatedCode = `${cityPrefix}${month}${year}-${randomNumbers}${randomLetters}`;
  
  return generatedCode;
};

// 🔔 WEBHOOK AUTO-SYNC: Webhook secret from your .env
const WEBHOOK_SECRET = 'mJHbyDfVB4F90aa+MpNU6LDsrqQx4NlaSMy5lR4TfpU=';

// 🔔 WEBHOOK AUTO-SYNC: Helper function to send webhook-style updates
const sendWebhookUpdate = async (payload) => {
  try {
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Generate signature
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadString)
    );
    
    // Convert to hex
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Send to your own webhook endpoint
    const response = await fetch('https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signatureHex
      },
      body: payloadString
    });
    
    const result = await response.json();
    console.log('✅ Webhook auto-update sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending webhook update:', error);
  }
};

// Add this helper function at the top of the component, after the imports
const normalizeArabicText = (text) => {
  if (!text) return '';
  
  // Convert to string if not already
  text = String(text);
  
  // Normalize Arabic characters
  return text
    // Normalize Alif variations to ا
    .replace(/[أإآ]/g, 'ا')
    // Normalize Teh Marbuta (ة) to Heh (ه)
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura (ى) to Yeh (ي)
    .replace(/ى/g, 'ي')
    // Remove diacritics (Tashkeel)
    .replace(/[ًٌٍَُِّْ]|[\u064B-\u065F]/g, '')
    // Convert to lowercase for case-insensitive comparison
    .toLowerCase();
};

// French translations for statuses
const statusTranslations = {
  // Primary delivery statuses
  'NEW_PARCEL': 'Nouveau colis',
  'PARCEL_CONFIRMED': 'Colis confirmé',
  'PICKED_UP': 'Ramassé',
  'DISTRIBUTION': 'En distribution',
  'IN_PROGRESS': 'En cours',
  'SENT': 'Expédié',
  'DELIVERED': 'Livré',
  'RETURNED': 'Retourné',
  'CANCELLED': 'Annulé',
  'WAITING_PICKUP': 'En attente de ramassage',
  'RECEIVED': 'Reçu',
  
  // Secondary statuses
  'REFUSE': 'Refusé',
  'NOANSWER': 'Pas de réponse',
  'UNREACHABLE': 'Injoignable',
  'HORS_ZONE': 'Hors zone',
  'POSTPONED': 'Reporté',
  'PROGRAMMER': 'Programmé',
  'DEUX': '2ème tentative',
  'TROIS': '3ème tentative',
  'ENVG': 'En voyage',
  'RETURN_BY_AMANA': 'Retour par Amana',
  'SENT_BY_AMANA': 'Envoyé par Amana',
  'CANCELED': 'Annulé',
  
  // Payment statuses
  'PAID': 'Payé',
  'NOT_PAID': 'Non payé',
  'INVOICED': 'Facturé',
  'PENDING': 'En attente',
  
  // Generic fallbacks
  'nouveau': 'Nouveau',
  'confirmé': 'Confirmé',
  'ramassé': 'Ramassé',
  'distribution': 'En distribution',
  'en cours': 'En cours',
  'expédié': 'Expédié',
  'livré': 'Livré',
  'retourné': 'Retourné',
  'annulé': 'Annulé',
  'attente': 'En attente',
  'reçu': 'Reçu',
  'payé': 'Payé',
  'non payé': 'Non payé',
  'facturé': 'Facturé'
};

// Helper to translate status to French
const translateStatus = (status) => {
  if (!status) return '';
  
  // Check exact match
  if (statusTranslations[status]) {
    return statusTranslations[status];
  }
  
  // Check case-insensitive match
  const statusUpper = status.toUpperCase();
  if (statusTranslations[statusUpper]) {
    return statusTranslations[statusUpper];
  }
  
  // Return original if no translation found
  return status;
};

// Helper to get status color based on status text
const getStatusColor = (status) => {
  if (!status) return '#6b7280';
  
  const statusLower = status.toLowerCase();
  
  // Primary delivery statuses
  if (status === 'NEW_PARCEL' || statusLower.includes('nouveau')) return '#3b82f6';
  if (status === 'PARCEL_CONFIRMED' || statusLower.includes('confirm')) return '#007bff';
  if (status === 'PICKED_UP' || statusLower.includes('ramassé')) return '#8b5cf6';
  if (status === 'DISTRIBUTION' || statusLower.includes('distribution')) return '#f59e0b';
  if (status === 'IN_PROGRESS' || statusLower.includes('en cours')) return '#f97316';
  if (status === 'SENT' || statusLower.includes('expédié')) return '#0891b2';
  if (status === 'DELIVERED' || statusLower.includes('livré')) return '#10b981';
  if (status === 'RETURNED' || statusLower.includes('retourné')) return '#ef4444';
  if (status === 'CANCELLED' || statusLower.includes('annulé')) return '#6b7280';
  if (status === 'WAITING_PICKUP' || statusLower.includes('attente')) return '#f59e0b';
  if (status === 'RECEIVED' || statusLower.includes('reçu')) return '#10b981';
  
  // Secondary statuses (specific)
  if (status === 'REFUSE' || statusLower.includes('refusé')) return '#dc2626';
  if (status === 'NOANSWER' || statusLower.includes('pas de réponse')) return '#f59e0b';
  if (status === 'UNREACHABLE' || statusLower.includes('injoignable')) return '#d97706';
  if (status === 'HORS_ZONE' || statusLower.includes('hors zone')) return '#7c3aed';
  if (status === 'POSTPONED' || statusLower.includes('reporté')) return '#8b5cf6';
  if (status === 'PROGRAMMER' || statusLower.includes('programmé')) return '#2563eb';
  if (status === 'DEUX' || statusLower.includes('2ème')) return '#f97316';
  if (status === 'TROIS' || statusLower.includes('3ème')) return '#ea580c';
  if (status === 'ENVG' || statusLower.includes('en voyage')) return '#0891b2';
  if (status === 'RETURN_BY_AMANA' || statusLower.includes('retour amana')) return '#b91c1c';
  if (status === 'SENT_BY_AMANA' || statusLower.includes('envoyé amana')) return '#1e40af';
  if (status === 'CANCELED' || statusLower.includes('annulé')) return '#6b7280';
  
  // Payment statuses
  if (statusLower.includes('payé') || statusLower.includes('paid')) return '#10b981';
  if (statusLower.includes('non payé') || statusLower.includes('not_paid')) return '#ef4444';
  if (statusLower.includes('facturé') || statusLower.includes('invoiced')) return '#8b5cf6';
  
  return '#6b7280';
};

// Get status description in French
const getStatusDescription = (status) => {
  const descriptions = {
    'DELIVERED': 'Colis livré avec succès',
    'RETURNED': 'Colis retourné à l\'expéditeur',
    'DISTRIBUTION': 'Colis en cours de livraison',
    'IN_PROGRESS': 'Colis en cours de traitement',
    'NEW_PARCEL': 'Nouveau colis enregistré',
    'WAITING_PICKUP': 'En attente de ramassage',
    'PICKED_UP': 'Colis ramassé',
    'SENT': 'Colis expédié',
    'RECEIVED': 'Colis reçu',
    'CANCELLED': 'Colis annulé',
    'CANCELED': 'Colis annulé',
    'REFUSE': 'Colis refusé par le destinataire',
    'NOANSWER': 'Pas de réponse du destinataire',
    'UNREACHABLE': 'Destinataire injoignable',
    'HORS_ZONE': 'Adresse hors zone de livraison',
    'POSTPONED': 'Livraison reportée',
    'PROGRAMMER': 'Livraison programmée',
    'DEUX': 'Deuxième tentative de livraison',
    'TROIS': 'Troisième tentative de livraison',
    'ENVG': 'Colis en voyage',
    'RETURN_BY_AMANA': 'Retour par Amana',
    'SENT_BY_AMANA': 'Envoyé par Amana'
  };
  
  return descriptions[status] || status;
};

// ==============================================
// PROMPT COMPONENTS
// ==============================================

// Delete Confirmation Modal (only modal left as it's a confirmation)
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, orderCode }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-confirm-icon">
          <AlertCircle size={48} />
        </div>
        
        <h3 className="delete-confirm-title">Confirmer la suppression</h3>
        
        <p className="delete-confirm-message">
          Êtes-vous sûr de vouloir supprimer la commande <strong>#{orderCode}</strong> ?
        </p>
        
        <p className="delete-confirm-warning">
          Cette action est irréversible et supprimera définitivement la commande.
        </p>
        
        <div className="delete-confirm-actions">
          <button onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-delete">
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Copy Success Notification
const CopyNotification = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="copy-notification" onClick={onClose}>
      <div className="copy-notification-content">
        <CheckCircle size={20} className="copy-notification-icon" />
        <span className="copy-notification-message">{message}</span>
      </div>
    </div>
  );
};

// City Autocomplete Component
const CityAutocomplete = ({ value, onChange, onSelect, disabled = false }) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Fetch cities from Welivexpress API
  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        "https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/listcities",
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      let citiesData = [];
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        citiesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        citiesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        for (let key in response.data) {
          if (Array.isArray(response.data[key])) {
            citiesData = response.data[key];
            break;
          }
        }
      }
      
      setCities(citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Impossible de charger les villes");
      setCities([]);
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
    const cityId = typeof city === 'object' && city.id ? city.id : cityName;
    
    setQuery(cityName);
    onChange(cityName);
    if (onSelect) onSelect(cityName, cityId);
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
            const cityId = typeof city === 'object' && city.id ? city.id : '';
            return (
              <li
                key={index}
                onMouseDown={() => handleSelectCity(city)}
                className="suggestion-item"
              >
                <MapPin size={14} />
                <span className="city-name">{cityName}</span>
                {cityId && <span className="city-id">(ID: {cityId})</span>}
              </li>
            );
          })}
        </ul>
      )}
      
      {error && <div className="city-error">{error}</div>}
      {!loading && cities.length === 0 && !error && (
        <div className="city-error">Aucune ville disponible</div>
      )}
    </div>
  );
};

// Book Selection Component with Arabic text normalization and auto-select all same ISBN
const BookSelector = ({ selectedBooks, onBooksChange, onTotalQuantityChange }) => {
  const dispatch = useDispatch();
  const { list: booksList = [], loading: booksLoading } = useSelector((state) => state.livres);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  // Filter books with Arabic text normalization
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return booksList;
    
    const normalizedSearchTerm = normalizeArabicText(searchTerm);
    
    return booksList.filter(book => {
      const normalizedTitle = normalizeArabicText(book.titre || "");
      const normalizedAuthor = normalizeArabicText(book.auteur || "");
      const normalizedIsbn = normalizeArabicText(book.isbn || "");
      
      return normalizedTitle.includes(normalizedSearchTerm) ||
             normalizedAuthor.includes(normalizedSearchTerm) ||
             normalizedIsbn.includes(normalizedSearchTerm);
    });
  }, [booksList, searchTerm]);

  // Update total quantity whenever selected books change
  useEffect(() => {
    if (selectedBooks.length > 0) {
      const totalQty = selectedBooks.reduce((sum, book) => sum + book.quantity, 0);
      if (onTotalQuantityChange) onTotalQuantityChange(totalQty);
    } else {
      if (onTotalQuantityChange) onTotalQuantityChange(0);
    }
  }, [selectedBooks, onTotalQuantityChange]);

  // Find all books with the same ISBN
  const findBooksWithSameIsbn = (book) => {
    if (!book.isbn || book.isbn.trim() === '') return [book];
    
    return booksList.filter(b => 
      b.isbn && 
      b.isbn.trim() !== '' && 
      b.isbn === book.isbn
    );
  };

  // Add all books with the same ISBN
  const addAllBooksWithSameIsbn = (selectedBook) => {
    const booksToAdd = findBooksWithSameIsbn(selectedBook);
    
    // Create a copy of current selected books
    let updatedBooks = [...selectedBooks];
    
    booksToAdd.forEach(book => {
      const existingBookIndex = updatedBooks.findIndex(b => b.id === book.id);
      
      if (existingBookIndex >= 0) {
        // Book already exists, increase quantity
        updatedBooks[existingBookIndex] = {
          ...updatedBooks[existingBookIndex],
          quantity: updatedBooks[existingBookIndex].quantity + 1,
          total: (updatedBooks[existingBookIndex].quantity + 1) * book.prix_achat,
          price: book.prix_achat
        };
      } else {
        // New book, add to list
        updatedBooks.push({
          id: book.id,
          titre: book.titre,
          auteur: book.auteur,
          prix_achat: book.prix_achat,
          price: book.prix_achat,
          quantity: 1,
          total: book.prix_achat,
          isbn: book.isbn
        });
      }
    });
    
    onBooksChange(updatedBooks);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleBookSelect = (book) => {
    addAllBooksWithSameIsbn(book);
  };

  const updateQuantity = (bookId, newQuantity) => {
    if (newQuantity < 1) {
      removeBook(bookId);
      return;
    }
    onBooksChange(
      selectedBooks.map(b => 
        b.id === bookId 
          ? { 
              ...b, 
              quantity: newQuantity, 
              total: newQuantity * b.prix_achat,
              price: b.prix_achat
            }
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

  // Group selected books by ISBN for display
  const groupedSelectedBooks = useMemo(() => {
    const groups = {};
    selectedBooks.forEach(book => {
      const key = book.isbn || `no-isbn-${book.id}`;
      if (!groups[key]) {
        groups[key] = {
          isbn: book.isbn,
          books: []
        };
      }
      groups[key].books.push(book);
    });
    return groups;
  }, [selectedBooks]);

  return (
    <div className="book-selector">
      <div className="book-search-container">
        <div className="book-search-input-wrapper">
          <BookOpen size={18} className="book-search-icon" />
          <input
            type="text"
            placeholder="Rechercher un livre par titre, auteur ou ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="book-search-input"
          />
          {booksLoading && <Loader size={16} className="book-search-spinner" />}
          {searchTerm && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setShowDropdown(false);
              }} 
              className="clear-book-search"
              title="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {showDropdown && searchTerm && (
          <div className="book-dropdown">
            {filteredBooks.length > 0 ? (
              filteredBooks.map(book => {
                const sameIsbnCount = book.isbn ? 
                  booksList.filter(b => b.isbn === book.isbn).length : 1;
                
                return (
                  <div
                    key={book.id}
                    className="book-dropdown-item"
                    onClick={() => handleBookSelect(book)}
                  >
                    <div className="book-dropdown-info">
                      <span className="book-dropdown-title">{book.titre || "Sans titre"}</span>
                      <span className="book-dropdown-author">{book.auteur || "Auteur inconnu"}</span>
                      {book.isbn && (
                        <span className="book-dropdown-isbn">
                          ISBN: {book.isbn} 
                          {sameIsbnCount > 1 && (
                            <span className="isbn-count-badge">({sameIsbnCount} exemplaires)</span>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="book-dropdown-price">{book.prix_achat || 0} MAD</span>
                  </div>
                );
              })
            ) : (
              <div className="book-dropdown-empty">
                <BookOpen size={24} />
                <span>Aucun livre trouvé</span>
                <small>Essayez avec d'autres termes</small>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedBooks.length > 0 && (
        <div className="selected-books">
          <div className="selected-books-header">
            <h4>Livres sélectionnés</h4>
            <span className="selected-count">{selectedBooks.length} livre(s)</span>
          </div>
          <div className="selected-books-list">
            {Object.entries(groupedSelectedBooks).map(([key, group]) => (
              <div key={key} className="isbn-group-container">
                {group.isbn && (
                  <div className="isbn-group-header-small">
                    <span className="isbn-label">ISBN: {group.isbn}</span>
                    <span className="isbn-count">{group.books.length} exemplaire(s)</span>
                  </div>
                )}
                {group.books.map(book => (
                  <div key={book.id} className="selected-book-item">
                    <div className="selected-book-info">
                      <span className="selected-book-title">{book.titre || "Sans titre"}</span>
                      <span className="selected-book-author">{book.auteur || "Auteur inconnu"}</span>
                      <span className="selected-book-price">{book.prix_achat || 0} MAD</span>
                    </div>
                    
                    <div className="selected-book-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => updateQuantity(book.id, book.quantity - 1)}
                          className="quantity-btn"
                          disabled={book.quantity <= 1}
                          title="Diminuer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="quantity-value">{book.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(book.id, book.quantity + 1)}
                          className="quantity-btn"
                          title="Augmenter"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <span className="selected-book-total">{book.total || 0} MAD</span>
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
            ))}
          </div>
          
          <div className="selected-books-summary">
            <span>Total livres:</span>
            <span className="summary-amount">{calculateSubtotal()} MAD</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Details Page Component
const OrderDetailsPage = ({ order, onBack }) => {
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    if (order && order.parcel_code) {
      fetchTrackingInfo(order.parcel_code);
    }
  }, [order]);

  const fetchTrackingInfo = async (parcelCode) => {
    setLoadingTracking(true);
    setTrackingError(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/trackparcel`,
        {
          params: { parcel_code: parcelCode },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log("Tracking response in order details:", response.data);

      if (response.data.success && response.data.data) {
        setTrackingInfo(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching tracking info:", err);
      setTrackingError("Impossible de récupérer les informations de suivi");
    } finally {
      setLoadingTracking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!order) return null;

  // Get statuses from tracking info or order
  const deliveryStatus = trackingInfo?.parcel?.delivery_status || order.statut;
  const secondaryStatus = trackingInfo?.parcel?.delivery_status_second || order.statut_second;
  const paymentStatus = trackingInfo?.parcel?.payment_status || order.payment_status;
  const paymentStatusText = trackingInfo?.parcel?.payment_status_text || order.payment_status_text;
  
  // Translate statuses to French
  const translatedDeliveryStatus = translateStatus(deliveryStatus);
  const translatedSecondaryStatus = secondaryStatus ? translateStatus(secondaryStatus) : null;
  const translatedPaymentStatus = translateStatus(paymentStatus);

  return (
    <div className="order-details-page">
      <div className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          Retour à la liste
        </button>
        <h2>Détails de la commande #{order.parcel_code}</h2>
      </div>

      <div className="page-content">
        {/* Webhook Status Banner */}
        {trackingInfo && (
          <div className="webhook-status-banner">
            <Bell size={16} />
            <span>Mise à jour en temps réel activée</span>
            <span className="live-badge">LIVE</span>
          </div>
        )}

        {/* Two column layout for tracking and order info */}
        <div className="details-two-column">
          {/* Left Column - Suivi Welivexpress */}
          <div className="details-left-column">
            {loadingTracking && (
              <div className="tracking-loading">
                <RefreshCw size={20} className="spinning" />
                <span>Chargement des informations de suivi en temps réel...</span>
              </div>
            )}

            {trackingError && (
              <div className="tracking-error">
                <AlertCircle size={20} />
                <span>{trackingError}</span>
              </div>
            )}

            {trackingInfo && trackingInfo.parcel && (
              <div className="tracking-info-section">
                <div className="tracking-info-header">
                  <Truck size={20} />
                  <h4>Suivi Welivexpress en temps réel</h4>
                  <span className="tracking-live-badge">LIVE</span>
                </div>
                
                {/* Status Cards with Secondary Status */}
                <div className="tracking-status-grid">
                  <div className="tracking-status-card">
                    <div className="tracking-status-label">
                      <Truck size={14} />
                      Statut de livraison
                    </div>
                    <div className="status-badge-container">
                      <div 
                        className="tracking-status-badge large"
                        style={{ 
                          backgroundColor: `${getStatusColor(deliveryStatus)}15`,
                          color: getStatusColor(deliveryStatus),
                          border: `1px solid ${getStatusColor(deliveryStatus)}30`
                        }}
                      >
                        {translatedDeliveryStatus}
                      </div>
                      {secondaryStatus && secondaryStatus !== '' && (
                        <div 
                          className="tracking-status-badge large secondary"
                          style={{ 
                            backgroundColor: `${getStatusColor(secondaryStatus)}15`,
                            color: getStatusColor(secondaryStatus),
                            border: `1px solid ${getStatusColor(secondaryStatus)}30`,
                            marginLeft: '8px'
                          }}
                        >
                          {translatedSecondaryStatus}
                        </div>
                      )}
                    </div>
                    {trackingInfo.tracking && (
                      <div className="tracking-status-description">
                        {getStatusDescription(secondaryStatus || deliveryStatus)}
                      </div>
                    )}
                  </div>

                  <div className="tracking-status-card">
                    <div className="tracking-status-label">
                      <CreditCard size={14} />
                      Statut de paiement
                    </div>
                    <div 
                      className="tracking-status-badge"
                      style={{ 
                        backgroundColor: `${getStatusColor(paymentStatus)}15`,
                        color: getStatusColor(paymentStatus),
                        border: `1px solid ${getStatusColor(paymentStatus)}30`
                      }}
                    >
                      {translatedPaymentStatus}
                    </div>
                    <div className="tracking-payment-text">
                      {paymentStatusText || getStatusDescription(paymentStatus)}
                    </div>
                  </div>
                </div>

                {/* Complete Parcel Information */}
                <div className="tracking-details-grid">
                  {/* Client Information */}
                  <div className="tracking-detail-card">
                    <div className="tracking-detail-header">
                      <User size={16} />
                      <h5>Client</h5>
                    </div>
                    <div className="tracking-detail-content">
                      <div className="tracking-detail-row">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">{trackingInfo.parcel.id || '-'}</span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">{trackingInfo.parcel.receiver || '-'}</span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Téléphone:</span>
                        <span className="detail-value">{trackingInfo.parcel.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="tracking-detail-card">
                    <div className="tracking-detail-header">
                      <MapPin size={16} />
                      <h5>Adresse</h5>
                    </div>
                    <div className="tracking-detail-content">
                      <div className="tracking-detail-row">
                        <span className="detail-label">Ville ID:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.city?.id || trackingInfo.parcel.city_id || '-'}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Ville:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.city?.name || trackingInfo.parcel.city || '-'}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Adresse:</span>
                        <span className="detail-value address">
                          {trackingInfo.parcel.address || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="tracking-detail-card">
                    <div className="tracking-detail-header">
                      <Package size={16} />
                      <h5>Colis</h5>
                    </div>
                    <div className="tracking-detail-content">
                      <div className="tracking-detail-row">
                        <span className="detail-label">Code:</span>
                        <span className="detail-value code">
                          {trackingInfo.parcel.code || '-'}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Produit:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.product?.name || '-'}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Quantité:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.product?.quantity || 1}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Prix:</span>
                        <span className="detail-value price">
                          {trackingInfo.parcel.price || 0} MAD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates Information */}
                  <div className="tracking-detail-card">
                    <div className="tracking-detail-header">
                      <Calendar size={16} />
                      <h5>Dates</h5>
                    </div>
                    <div className="tracking-detail-content">
                      <div className="tracking-detail-row">
                        <span className="detail-label">Création:</span>
                        <span className="detail-value">
                          {formatDate(trackingInfo.parcel.created_at)}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Créé le:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.created_date || '-'}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Mise à jour:</span>
                        <span className="detail-value">
                          {formatDate(trackingInfo.parcel.updated_at)}
                        </span>
                      </div>
                      <div className="tracking-detail-row">
                        <span className="detail-label">Mis à jour le:</span>
                        <span className="detail-value">
                          {trackingInfo.parcel.updated_date || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note if exists */}
                {trackingInfo.parcel.note && (
                  <div className="tracking-note">
                    <FileText size={16} />
                    <div className="tracking-note-content">
                      <span className="note-label">Note:</span>
                      <p>{trackingInfo.parcel.note}</p>
                    </div>
                  </div>
                )}

                {/* Can Open Status */}
                <div className="tracking-can-open">
                  {trackingInfo.parcel.can_open === 1 ? (
                    <div className="can-open-badge allowed">
                      <PackageCheck size={16} />
                      Colis ouvert / vérifié
                    </div>
                  ) : (
                    <div className="can-open-badge not-allowed">
                      <PackageX size={16} />
                      Colis non ouvert
                    </div>
                  )}
                </div>

                {/* Query Time */}
                {trackingInfo.query_time && (
                  <div className="tracking-query-time">
                    <Clock size={14} />
                    <span>Dernière mise à jour: {formatDate(trackingInfo.query_time)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Informations de la commande */}
          <div className="details-right-column">
            <div className="order-info-section">
              <div className="order-info-header">
                <Info size={20} />
                <h4>Informations de la commande</h4>
                <span className="order-info-badge">DÉTAILS</span>
              </div>

              {/* Order Information Cards */}
              <div className="order-info-grid">
                <div className="order-info-card">
                  <div className="order-info-label">
                    <User size={14} />
                    Client
                  </div>
                  <div className="order-info-value">
                    {order.parcel_receiver || "-"}
                  </div>
                </div>

                <div className="order-info-card">
                  <div className="order-info-label">
                    <Phone size={14} />
                    Téléphone
                  </div>
                  <div className="order-info-value">
                    {order.parcel_phone || "-"}
                  </div>
                </div>

                <div className="order-info-card">
                  <div className="order-info-label">
                    <Layers size={14} />
                    Quantité totale
                  </div>
                  <div className="order-info-value">
                    {order.parcel_prd_qty || 0}
                  </div>
                </div>

                <div className="order-info-card">
                  <div className="order-info-label">
                    <MapPin size={14} />
                    Ville
                  </div>
                  <div className="order-info-value">
                    {order.parcel_city || "-"}
                  </div>
                </div>

                <div className="order-info-card full-width">
                  <div className="order-info-label">
                    <Map size={14} />
                    Adresse
                  </div>
                  <div className="order-info-value address">
                    {order.parcel_address || "-"}
                  </div>
                </div>

                <div className="order-info-card">
                  <div className="order-info-label">
                    <Calendar size={14} />
                    Date
                  </div>
                  <div className="order-info-value">
                    {order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}
                  </div>
                </div>

                <div className="order-info-card">
                  <div className="order-info-label">
                    <Clock size={14} />
                    Statut principal
                  </div>
                  <div className="order-info-value">
                    {loadingTracking ? (
                      <RefreshCw size={14} className="spinning" />
                    ) : (
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getStatusColor(deliveryStatus)}15`,
                          color: getStatusColor(deliveryStatus),
                          border: `1px solid ${getStatusColor(deliveryStatus)}30`
                        }}
                      >
                        {translatedDeliveryStatus}
                      </span>
                    )}
                  </div>
                </div>

                {secondaryStatus && secondaryStatus !== '' && (
                  <div className="order-info-card">
                    <div className="order-info-label">
                      <AlertCircle size={14} />
                      Statut secondaire
                    </div>
                    <div className="order-info-value">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getStatusColor(secondaryStatus)}15`,
                          color: getStatusColor(secondaryStatus),
                          border: `1px solid ${getStatusColor(secondaryStatus)}30`
                        }}
                      >
                        {translatedSecondaryStatus}
                      </span>
                    </div>
                  </div>
                )}

                <div className="order-info-card">
                  <div className="order-info-label">
                    <CreditCard size={14} />
                    Statut paiement
                  </div>
                  <div className="order-info-value">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: `${getStatusColor(paymentStatus)}15`,
                        color: getStatusColor(paymentStatus),
                        border: `1px solid ${getStatusColor(paymentStatus)}30`
                      }}
                    >
                      {translatedPaymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="order-financial-summary">
                <h5>Résumé financier</h5>
                <div className="financial-row">
                  <span>Sous-total livres:</span>
                  <span className="financial-amount">{order.total || 0} MAD</span>
                </div>
                <div className="financial-row">
                  <span>Frais de livraison:</span>
                  <span className="financial-amount">{order.frais_livraison || 0} MAD</span>
                </div>
                <div className="financial-row">
                  <span>Frais de packaging:</span>
                  <span className="financial-amount">{order.frais_packaging || 0} MAD</span>
                </div>
                <div className="financial-row">
                  <span>Total (livres + frais):</span>
                  <span className="financial-amount">{(order.total || 0) + (order.frais_livraison || 0) + (order.frais_packaging || 0)} MAD</span>
                </div>
                <div className="financial-row">
                  <span>Prix colis (Welivexpress):</span>
                  <span className="financial-amount">{order.parcel_price || 0} MAD</span>
                </div>
                <div className="financial-row total">
                  <span>Profit (parcel_price - total):</span>
                  <span className={`financial-amount ${order.profit < 0 ? 'negative' : ''}`}>
                    {order.profit || 0} MAD
                    {order.profit < 0 && ' (Perte)'}
                  </span>
                </div>
                <div className="financial-calculation-hint">
                  <small>Profit = Prix colis - (Total livres + Frais livraison + Frais packaging)</small>
                </div>
                {order.statut === 'RETURNED' && (
                  <div className="financial-warning">
                    <AlertCircle size={14} />
                    <span>Commande retournée - Profit négatif car les frais sont perdus</span>
                  </div>
                )}
              </div>

              {/* Order Note */}
              {order.parcel_note && (
                <div className="order-note">
                  <FileText size={16} />
                  <div className="order-note-content">
                    <span className="note-label">Note:</span>
                    <p>{order.parcel_note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Books Section - Full Width Below */}
        <div className="details-section full-width">
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
                    <td>{book.price || book.prix_achat || 0} MAD</td>
                    <td>{book.quantity || 1}</td>
                    <td>{(book.price || book.prix_achat || 0) * (book.quantity || 1)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-books">Aucun livre dans cette commande</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Order Page Component - COMPACT VERSION (no scroll)
const AddOrderPage = ({ onBack, onSubmit }) => {
  const dispatch = useDispatch();
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  
  // Track if total was manually edited
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(false);
  
  // Form state for new order - Generate initial code with default 'CITY' prefix
  const [newOrderData, setNewOrderData] = useState({
    parcel_code: generateOrderCode(""), // Use default 'CITY' as prefix
    parcel_receiver: "",
    parcel_phone: "",
    parcel_prd_qty: 0,
    parcel_city: "",
    parcel_address: "",
    parcel_price: null,
    frais_livraison: 35,
    frais_packaging: 0,
    total: null,
    profit: null,
    parcel_note: "",
    parcel_open: 1,
    livres: [],
    statut: "NEW_PARCEL",
    date: new Date().toISOString().split('T')[0]
  });

  // Reset manual edit flags when books change
  useEffect(() => {
    setTotalManuallyEdited(false);
  }, [newOrderData.livres]);

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      setPhoneError("Le numéro de téléphone doit contenir exactement 10 chiffres");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Calculate books subtotal, total, and profit
  useEffect(() => {
    const booksSubtotal = (newOrderData.livres || []).reduce(
      (sum, book) => sum + (book.prix_achat * book.quantity), 0
    );
    
    const delivery = parseFloat(newOrderData.frais_livraison) || 0;
    const packaging = parseFloat(newOrderData.frais_packaging) || 0;
    
    let total;
    if (!totalManuallyEdited || newOrderData.livres.length === 0) {
      total = booksSubtotal;
    } else {
      total = parseFloat(newOrderData.total) || 0;
    }
    
    // Use manually entered parcel price or calculate if empty
    const parcelPrice = newOrderData.parcel_price !== null && newOrderData.parcel_price !== '' 
      ? parseFloat(newOrderData.parcel_price) 
      : null;
    
    // Calculate profit if we have parcel price
    let profit = null;
    if (parcelPrice !== null) {
      profit = parcelPrice - (total + delivery + packaging);
    }
    
    setNewOrderData(prev => {
      const updates = {};
      if (prev.total !== total) updates.total = total;
      if (prev.profit !== profit) updates.profit = profit;
      
      if (Object.keys(updates).length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        ...updates
      };
    });
  }, [
    newOrderData.livres, 
    newOrderData.frais_livraison, 
    newOrderData.frais_packaging,
    newOrderData.total,
    newOrderData.parcel_price,
    totalManuallyEdited
  ]);

  const handleNewOrderChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'parcel_phone') {
      validatePhone(value);
    }
    
    // Track manual edits
    if (name === 'total') {
      setTotalManuallyEdited(true);
    }
    
    setNewOrderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : 
               (name === 'parcel_price' || name === 'total' || name === 'frais_livraison' || name === 'frais_packaging') ? 
               (value === '' ? null : parseFloat(value)) : value
    }));
  };

  const handleBooksChange = (books) => {
    setNewOrderData(prev => ({
      ...prev,
      livres: books
    }));
  };

  const handleTotalQuantityChange = (qty) => {
    setNewOrderData(prev => ({
      ...prev,
      parcel_prd_qty: qty
    }));
  };

  const handleNewCitySelect = (city, cityId) => {
    // Generate new order code with the selected city
    const newCode = generateOrderCode(city);
    
    setNewOrderData(prev => ({
      ...prev,
      parcel_city: city,
      parcel_code: newCode // Update the code with city prefix
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newOrderData.parcel_receiver || !newOrderData.parcel_city) {
        setAddError("Veuillez remplir tous les champs obligatoires (client, ville)");
        return;
    }

    if (newOrderData.livres.length === 0) {
        setAddError("Veuillez sélectionner au moins un livre");
        return;
    }

    // Validate phone if provided
    if (newOrderData.parcel_phone && !validatePhone(newOrderData.parcel_phone)) {
        setAddError(phoneError);
        return;
    }

    // Validate that parcel price is entered
    if (newOrderData.parcel_price === null || newOrderData.parcel_price === '') {
        setAddError("Veuillez entrer le prix du colis");
        return;
    }

    const delivery = parseFloat(newOrderData.frais_livraison) || 35;
    const packaging = parseFloat(newOrderData.frais_packaging) || 0;
    const total = parseFloat(newOrderData.total) || 0;
    
    // Use manually entered price
    const parcelPrice = parseFloat(newOrderData.parcel_price);
    
    // Calculate profit
    let profit = parcelPrice - (total + delivery + packaging);

    const formattedLivres = newOrderData.livres.map(book => ({
        id: book.id,
        titre: book.titre,
        auteur: book.auteur || '',
        quantity: parseInt(book.quantity),
        price: parseFloat(book.prix_achat),
        total: parseFloat(book.prix_achat) * parseInt(book.quantity)
    }));

    const orderToCreate = {
        parcel_code: newOrderData.parcel_code,
        parcel_receiver: newOrderData.parcel_receiver,
        parcel_phone: newOrderData.parcel_phone || "",
        parcel_prd_qty: newOrderData.parcel_prd_qty,
        parcel_city: newOrderData.parcel_city,
        parcel_address: newOrderData.parcel_address || "",
        parcel_price: parseFloat(parcelPrice.toFixed(2)),
        frais_livraison: parseFloat(delivery.toFixed(2)),
        frais_packaging: parseFloat(packaging.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        parcel_note: newOrderData.parcel_note || "",
        parcel_open: newOrderData.parcel_open ? 1 : 0,
        livres: formattedLivres,
        date: newOrderData.date,
        statut: newOrderData.statut || "NEW_PARCEL"
    };

    console.log("📦 Order to create:", orderToCreate);

    setAddLoading(true);
    setAddError(null);

    try {
        // ✅ JUST CREATE THE ORDER - NO FAKE WEBHOOK
        const result = await onSubmit(orderToCreate);
        
        // Go back to list view
        onBack();
        
    } catch (error) {
        console.error("❌ Create failed:", error);
        setAddError(
            error?.message || 
            "Erreur lors de la création de la commande. Veuillez réessayer."
        );
    } finally {
        setAddLoading(false);
    }
};

  return (
    <div className="add-order-page">
      <div className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          Retour à la liste
        </button>
        <h2>Nouvelle commande</h2>
      </div>

      <div className="page-content no-scroll compact-form">
        {addError && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            {addError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="order-form compact">
          {/* Row 1: Code and Date */}
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
              <small className="field-hint">Généré automatiquement</small>
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

          {/* Row 2: Client and Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Client <span className="required">*</span></label>
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
              <label>Téléphone <span className="required">*</span></label>
              <input
                type="text"
                name="parcel_phone"
                value={newOrderData.parcel_phone}
                onChange={handleNewOrderChange}
                placeholder="10 chiffres"
                maxLength="10"
                pattern="[0-9]{10}"
                className={phoneError ? "input-error" : ""}
                required
              />
              {phoneError && <small className="error-hint">{phoneError}</small>}
            </div>
          </div>

          {/* Row 3: City and Address */}
          <div className="form-row">
            <div className="form-group">
              <label>Ville <span className="required">*</span></label>
              <CityAutocomplete
                value={newOrderData.parcel_city}
                onChange={(value) => setNewOrderData(prev => ({ ...prev, parcel_city: value }))}
                onSelect={handleNewCitySelect}
              />
              <small className="field-hint">La sélection met à jour le code</small>
            </div>

            <div className="form-group">
              <label>Adresse <span className="required">*</span></label>
              <input
                type="text"
                name="parcel_address"
                value={newOrderData.parcel_address}
                onChange={handleNewOrderChange}
                placeholder="Adresse"
                required
              />
            </div>
          </div>

          {/* Row 4: Book Selector - takes full width */}
          <div className="form-group full-width">
            <label>Livres <span className="required">*</span></label>
            <BookSelector 
              selectedBooks={newOrderData.livres}
              onBooksChange={handleBooksChange}
              onTotalQuantityChange={handleTotalQuantityChange}
            />
          </div>

          {/* Row 5: Quantity and Parcel Price */}
          <div className="form-row">
            <div className="form-group">
              <label>Quantité totale</label>
              <div className="input-with-icon">
                <Layers size={20} className="input-icon" />
                <input
                  type="number"
                  name="parcel_prd_qty"
                  value={newOrderData.parcel_prd_qty}
                  onChange={handleNewOrderChange}
                  placeholder="Qté"
                  min="1"
                  required
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Prix colis (MAD) <span className="required">*</span></label>
              <div className="input-with-icon price-input">
                <DollarSign size={20} className="input-icon" />
                <input
                  type="number"
                  name="parcel_price"
                  value={newOrderData.parcel_price === null ? '' : newOrderData.parcel_price}
                  onChange={handleNewOrderChange}
                  placeholder="Prix"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 6: Delivery Fee and Packaging Fee */}
          <div className="form-row">
            <div className="form-group">
              <label>Frais livraison</label>
              <div className="input-with-icon">
                <Truck size={20} className="input-icon" />
                <input
                  type="number"
                  name="frais_livraison"
                  value={newOrderData.frais_livraison === null ? '' : newOrderData.frais_livraison}
                  onChange={handleNewOrderChange}
                  placeholder="35"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Frais packaging</label>
              <div className="input-with-icon">
                <Box size={20} className="input-icon" />
                <input
                  type="number"
                  name="frais_packaging"
                  value={newOrderData.frais_packaging === null ? '' : newOrderData.frais_packaging}
                  onChange={handleNewOrderChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Row 7: Total and Profit */}
          <div className="form-row">
            <div className="form-group">
              <label>Total livres</label>
              <div className="input-with-icon">
                <BookOpen size={20} className="input-icon" />
                <input
                  type="number"
                  name="total"
                  value={newOrderData.total === null ? '' : newOrderData.total}
                  readOnly
                  className="readonly-input"
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Profit</label>
              <div className="input-with-icon">
                <DollarSign size={20} className="input-icon" />
                <input
                  type="number"
                  name="profit"
                  value={newOrderData.profit === null ? '' : newOrderData.profit}
                  readOnly
                  className={`readonly-input ${newOrderData.profit < 0 ? 'negative' : ''}`}
                  placeholder="Auto"
                />
              </div>
            </div>
          </div>

          {/* Row 8: Note */}
          <div className="form-group full-width">
            <label>Note</label>
            <input
              type="text"
              name="parcel_note"
              value={newOrderData.parcel_note}
              onChange={handleNewOrderChange}
              placeholder="Instructions spéciales"
            />
          </div>

          {/* Row 9: Checkbox */}
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

          {/* Price Info - Compact */}
          <div className="price-info-warning compact">
            <Info size={16} />
            <span>
              <strong>Code généré:</strong> {newOrderData.parcel_code}
            </span>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onBack}
              className="btn-secondary"
              disabled={addLoading}
            >
              Annuler
            </button>
            <button 
              type="submit"
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
                  <Save size={20} />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Update Order Page Component - COMPLETE with proper data mapping from DB
const UpdateOrderPage = ({ order, onBack, onSubmit }) => {
  const dispatch = useDispatch();
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  
  // Track if total was manually edited
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(false);
  
  // Form state for update
  const [formData, setFormData] = useState({
    parcel_receiver: "",
    parcel_phone: "",
    parcel_prd_qty: 0,
    parcel_city: "",
    parcel_address: "",
    parcel_price: null,
    frais_livraison: 35,
    frais_packaging: 0,
    total: null,
    profit: null,
    parcel_note: "",
    parcel_open: 1,
    statut: "",
    statut_second: "",
    livres: [],
    date: ""
  });

  // Load order data when component mounts or order changes
  useEffect(() => {
    if (order) {
      console.log("📦 Order data from DB:", order);
      
      // Format date properly if it exists
      let formattedDate = "";
      if (order.date) {
        try {
          // Handle different date formats
          const dateObj = new Date(order.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("Error formatting date:", e);
        }
      }

      // Process livres data - handle different possible structures
      let processedLivres = [];
      if (order.livres && Array.isArray(order.livres)) {
        processedLivres = order.livres.map(book => ({
          id: book.id || book.livre_id || book.book_id,
          titre: book.titre || book.title || book.nom || "Livre",
          auteur: book.auteur || book.author || "Auteur inconnu",
          prix_achat: parseFloat(book.prix_achat || book.price || book.prix || 0),
          quantity: parseInt(book.quantity || book.quantite || book.qty || 1),
          total: parseFloat(book.prix_achat || book.price || 0) * parseInt(book.quantity || 1)
        }));
      }

      // Calculate total from livres if not provided
      let calculatedTotal = order.total;
      if (processedLivres.length > 0 && (!calculatedTotal || calculatedTotal === 0)) {
        calculatedTotal = processedLivres.reduce((sum, book) => sum + (book.prix_achat * book.quantity), 0);
      }

      // Calculate quantity from livres if not provided
      let calculatedQty = order.parcel_prd_qty;
      if (processedLivres.length > 0 && (!calculatedQty || calculatedQty === 0)) {
        calculatedQty = processedLivres.reduce((sum, book) => sum + book.quantity, 0);
      }

      setFormData({
        parcel_receiver: order.parcel_receiver || order.receiver || order.client_nom || "",
        parcel_phone: order.parcel_phone || order.phone || order.client_telephone || "",
        parcel_prd_qty: calculatedQty || 0,
        parcel_city: order.parcel_city || order.city || order.ville || "",
        parcel_address: order.parcel_address || order.address || order.adresse || "",
        parcel_price: order.parcel_price !== undefined && order.parcel_price !== null 
          ? parseFloat(order.parcel_price) 
          : (order.price ? parseFloat(order.price) : null),
        frais_livraison: order.frais_livraison !== undefined && order.frais_livraison !== null
          ? parseFloat(order.frais_livraison)
          : (order.delivery_fee ? parseFloat(order.delivery_fee) : 35),
        frais_packaging: order.frais_packaging !== undefined && order.frais_packaging !== null
          ? parseFloat(order.frais_packaging)
          : (order.packaging_fee ? parseFloat(order.packaging_fee) : 0),
        total: calculatedTotal !== undefined && calculatedTotal !== null
          ? parseFloat(calculatedTotal)
          : (order.total ? parseFloat(order.total) : null),
        profit: order.profit !== undefined && order.profit !== null
          ? parseFloat(order.profit)
          : null,
        parcel_note: order.parcel_note || order.note || order.notes || "",
        parcel_open: 1, // Force to checked
        statut: order.statut || order.status || order.delivery_status || "NEW_PARCEL",
        statut_second: order.statut_second || order.secondary_status || "",
        livres: processedLivres,
        date: formattedDate || new Date().toISOString().split('T')[0]
      });

      // Log what we've mapped for debugging
      console.log("📋 Mapped form data:", {
        receiver: order.parcel_receiver || order.receiver,
        city: order.parcel_city || order.city,
        qty: calculatedQty,
        livres: processedLivres.length,
        date: formattedDate
      });
    }
  }, [order]);

  // Reset manual edit flag when livres change
  useEffect(() => {
    setTotalManuallyEdited(false);
  }, [formData.livres]);

  // Validate phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      setPhoneError("Le numéro de téléphone doit contenir exactement 10 chiffres");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Calculate books subtotal, total, and profit
  useEffect(() => {
    const booksSubtotal = (formData.livres || []).reduce(
      (sum, book) => sum + ((book.prix_achat || 0) * (book.quantity || 1)), 0
    );
    
    const delivery = parseFloat(formData.frais_livraison) || 35;
    const packaging = parseFloat(formData.frais_packaging) || 0;
    
    let total;
    if (!totalManuallyEdited || formData.livres.length === 0) {
      total = booksSubtotal;
    } else {
      total = parseFloat(formData.total) || 0;
    }
    
    // Update quantity based on livres
    const totalQty = (formData.livres || []).reduce((sum, book) => sum + (book.quantity || 1), 0);
    
    // Use parcel price from form
    const parcelPrice = formData.parcel_price !== null && formData.parcel_price !== '' 
      ? parseFloat(formData.parcel_price) 
      : null;
    
    // Calculate profit if we have parcel price
    let profit = null;
    if (parcelPrice !== null) {
      profit = parcelPrice - (total + delivery + packaging);
    }
    
    setFormData(prev => {
      const updates = {};
      if (prev.total !== total) updates.total = total;
      if (prev.profit !== profit) updates.profit = profit;
      if (prev.parcel_prd_qty !== totalQty) updates.parcel_prd_qty = totalQty;
      
      if (Object.keys(updates).length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        ...updates
      };
    });
  }, [
    formData.livres, 
    formData.frais_livraison, 
    formData.frais_packaging,
    formData.total,
    formData.parcel_price,
    totalManuallyEdited
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'parcel_phone') {
      validatePhone(value);
    }
    
    // Track manual edits for total
    if (name === 'total') {
      setTotalManuallyEdited(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : 
               (name === 'parcel_price' || name === 'total' || name === 'frais_livraison' || name === 'frais_packaging') ? 
               (value === '' ? null : parseFloat(value)) : value
    }));
  };

  const handleBooksChange = (books) => {
    setFormData(prev => ({
      ...prev,
      livres: books
    }));
  };

  const handleTotalQuantityChange = (qty) => {
    setFormData(prev => ({
      ...prev,
      parcel_prd_qty: qty
    }));
  };

  const handleCitySelect = (city, cityId) => {
    setFormData(prev => ({
      ...prev,
      parcel_city: city
      // Note: We don't update parcel_code here as it's read-only in edit mode
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!order) return;

  // Validate phone if provided
  if (formData.parcel_phone && !validatePhone(formData.parcel_phone)) {
      setUpdateError(phoneError);
      return;
  }

  setUpdateLoading(true);
  setUpdateError(null);

  try {
    const updateData = {};
    
    // Check all fields for changes
    Object.keys(formData).forEach(key => {
      // Special handling for livres - always include if they exist and are different
      if (key === 'livres') {
        // Compare livres arrays
        const currentLivres = JSON.stringify(formData.livres);
        const originalLivres = JSON.stringify(order.livres || []);
        
        if (currentLivres !== originalLivres) {
          updateData.livres = formData.livres;
        }
        return;
      }
      
      // Convert to string for comparison to handle numbers vs strings
      const formValue = formData[key] === null || formData[key] === undefined ? '' : String(formData[key]);
      const orderValue = order[key] === null || order[key] === undefined ? '' : String(order[key]);
      
      if (formValue !== orderValue) {
        // For statut_second, if it's empty string, send as null to backend
        if (key === 'statut_second' && formData[key] === '') {
          updateData[key] = null;
        } else {
          updateData[key] = formData[key];
        }
      }
    });

    // Also update quantity based on livres total
    if (formData.livres && formData.livres.length > 0) {
      const totalQty = formData.livres.reduce((sum, book) => sum + (book.quantity || 1), 0);
      if (totalQty !== order.parcel_prd_qty) {
        updateData.parcel_prd_qty = totalQty;
      }
    }

    // Log what we're sending for debugging
    console.log("📤 Sending update data:", updateData);

    if (Object.keys(updateData).length === 0) {
      onBack();
      return;
    }

    await onSubmit(order.id, updateData);
    onBack();
    
  } catch (error) {
    console.error("Update failed:", error);
    
    // Log the actual error response from server
    if (error.response) {
      console.error("Server error response:", error.response.data);
      setUpdateError(
        error.response.data?.message || 
        error.response.data?.error ||
        `Erreur ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    } else {
      setUpdateError(
        error?.message || 
        "Erreur lors de la mise à jour. Veuillez réessayer."
      );
    }
  } finally {
    setUpdateLoading(false);
  }
};

  if (!order) return null;

  return (
    <div className="update-order-page">
      <div className="page-header">
        <button onClick={onBack} className="btn-back">
          <ArrowLeft size={20} />
          Retour à la liste
        </button>
        <h2>Modifier la commande #{order.parcel_code}</h2>
      </div>

      <div className="page-content no-scroll compact-form">
        {updateError && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            {updateError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="order-form compact">
          {/* Row 1: Code (read-only) and Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Code colis</label>
              <input
                type="text"
                value={order.parcel_code || order.code || ""}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Row 2: Client and Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Client <span className="required">*</span></label>
              <input
                type="text"
                name="parcel_receiver"
                value={formData.parcel_receiver}
                onChange={handleInputChange}
                placeholder="Nom du client"
                required
              />
            </div>

            <div className="form-group">
              <label>Téléphone <span className="required">*</span></label>
              <input
                type="text"
                name="parcel_phone"
                value={formData.parcel_phone}
                onChange={handleInputChange}
                placeholder="10 chiffres"
                maxLength="10"
                pattern="[0-9]{10}"
                className={phoneError ? "input-error" : ""}
                required
              />
              {phoneError && <small className="error-hint">{phoneError}</small>}
            </div>
          </div>

          {/* Row 3: City and Address */}
          <div className="form-row">
            <div className="form-group">
              <label>Ville <span className="required">*</span></label>
              <CityAutocomplete
                value={formData.parcel_city}
                onChange={(value) => setFormData(prev => ({ ...prev, parcel_city: value }))}
                onSelect={handleCitySelect}
              />
            </div>

            <div className="form-group">
              <label>Adresse <span className="required">*</span></label>
              <input
                type="text"
                name="parcel_address"
                value={formData.parcel_address}
                onChange={handleInputChange}
                placeholder="Adresse"
                required
              />
            </div>
          </div>

          {/* Row 4: Statuses */}
          <div className="form-row">
            <div className="form-group">
              <label>Statut principal</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                className="statut-select"
              >
                <option value="NEW_PARCEL">Nouveau colis</option>
                <option value="PARCEL_CONFIRMED">Colis confirmé</option>
                <option value="PICKED_UP">Ramassé</option>
                <option value="DISTRIBUTION">En distribution</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="SENT">Expédié</option>
                <option value="DELIVERED">Livré</option>
                <option value="RETURNED">Retourné</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            <div className="form-group">
              <label>Statut secondaire</label>
              <select
                name="statut_second"
                value={formData.statut_second}
                onChange={handleInputChange}
                className="statut-select"
              >
                <option value="">Aucun</option>
                <option value="REFUSE">Refusé</option>
                <option value="NOANSWER">Pas de réponse</option>
                <option value="UNREACHABLE">Injoignable</option>
                <option value="HORS_ZONE">Hors zone</option>
                <option value="POSTPONED">Reporté</option>
                <option value="PROGRAMMER">Programmé</option>
                <option value="DEUX">2ème tentative</option>
                <option value="TROIS">3ème tentative</option>
                <option value="ENVG">En voyage</option>
                <option value="RETURN_BY_AMANA">Retour par Amana</option>
                <option value="SENT_BY_AMANA">Envoyé par Amana</option>
                <option value="CANCELED">Annulé</option>
              </select>
            </div>
          </div>

          {/* Row 5: Book Selector - takes full width */}
          <div className="form-group full-width">
            <label>Livres <span className="required">*</span></label>
            <BookSelector 
              selectedBooks={formData.livres}
              onBooksChange={handleBooksChange}
              onTotalQuantityChange={handleTotalQuantityChange}
            />
          </div>

          {/* Row 6: Quantity and Parcel Price */}
          <div className="form-row">
            <div className="form-group">
              <label>Quantité totale</label>
              <div className="input-with-icon">
                <Layers size={20} className="input-icon" />
                <input
                  type="number"
                  name="parcel_prd_qty"
                  value={formData.parcel_prd_qty}
                  onChange={handleInputChange}
                  placeholder="Qté"
                  min="1"
                  required
                  readOnly
                  className="readonly-input"
                />
              </div>
              <small className="field-hint">Calculé automatiquement à partir des livres</small>
            </div>

            <div className="form-group">
              <label>Prix colis (MAD) <span className="required">*</span></label>
              <div className="input-with-icon price-input">
                <DollarSign size={20} className="input-icon" />
                <input
                  type="number"
                  name="parcel_price"
                  value={formData.parcel_price === null ? '' : formData.parcel_price}
                  onChange={handleInputChange}
                  placeholder="Prix"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 7: Delivery Fee and Packaging Fee */}
          <div className="form-row">
            <div className="form-group">
              <label>Frais livraison</label>
              <div className="input-with-icon">
                <Truck size={20} className="input-icon" />
                <input
                  type="number"
                  name="frais_livraison"
                  value={formData.frais_livraison === null ? '' : formData.frais_livraison}
                  onChange={handleInputChange}
                  placeholder="35"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Frais packaging</label>
              <div className="input-with-icon">
                <Box size={20} className="input-icon" />
                <input
                  type="number"
                  name="frais_packaging"
                  value={formData.frais_packaging === null ? '' : formData.frais_packaging}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Row 8: Total and Profit */}
          <div className="form-row">
            <div className="form-group">
              <label>Total livres</label>
              <div className="input-with-icon">
                <BookOpen size={20} className="input-icon" />
                <input
                  type="number"
                  name="total"
                  value={formData.total === null ? '' : formData.total}
                  onChange={handleInputChange}
                  className={totalManuallyEdited ? "manual-edit-input" : ""}
                  placeholder="Auto"
                  step="0.01"
                />
                {totalManuallyEdited && (
                  <span className="manual-edit-badge">Manuel</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Profit</label>
              <div className="input-with-icon">
                <DollarSign size={20} className="input-icon" />
                <input
                  type="number"
                  name="profit"
                  value={formData.profit === null ? '' : formData.profit}
                  readOnly
                  className={`readonly-input ${formData.profit < 0 ? 'negative' : ''}`}
                  placeholder="Auto"
                />
              </div>
            </div>
          </div>

          {/* Row 9: Note */}
          <div className="form-group full-width">
            <label>Note</label>
            <textarea
              name="parcel_note"
              value={formData.parcel_note}
              onChange={handleInputChange}
              placeholder="Instructions spéciales"
              rows="3"
            />
          </div>

          {/* Row 10: Checkbox */}
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

          {/* Price Info Warning */}
          <div className="price-info-warning compact">
            <Info size={16} />
            <span>
              <strong>Code:</strong> {order.parcel_code}
            </span>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onBack}
              className="btn-secondary"
              disabled={updateLoading}
            >
              Annuler
            </button>
            <button 
              type="submit"
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
                  <Save size={20} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Webhook Test Component
const WebhookTestPanel = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  const testWebhook = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/test-webhook",
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      setConfig(response.data);
    } catch (err) {
      console.error("Error testing webhook:", err);
      setError("Erreur lors du test du webhook");
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer la configuration webhook ?")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        "https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/delete-webhook",
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      setConfig(null);
      alert("Configuration webhook supprimée avec succès");
    } catch (err) {
      console.error("Error deleting webhook:", err);
      setError("Erreur lors de la suppression du webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="webhook-test-panel">
      <div className="webhook-header">
        <Webhook size={20} />
        <h3>Configuration Webhook Welivexpress</h3>
        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>
      
      <div className="webhook-content">
        {loading && <Loader size={24} className="spinning" />}
        
        {error && (
          <div className="webhook-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {config && (
          <div className="webhook-config">
            <div className="config-item">
              <span className="config-label">Statut:</span>
              <span className="config-value success">✓ Actif</span>
            </div>
            <div className="config-item">
              <span className="config-label">URL Webhook:</span>
              <span className="config-value">{config.webhook_url}</span>
            </div>
            {config.current_config && (
              <>
                <div className="config-item">
                  <span className="config-label">Événements:</span>
                  <span className="config-value">
                    {config.current_config.events?.join(', ') || 'Tous'}
                  </span>
                </div>
                <div className="config-item">
                  <span className="config-label">Tentatives:</span>
                  <span className="config-value">{config.current_config.retry_count}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Timeout:</span>
                  <span className="config-value">{config.current_config.timeout}s</span>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="webhook-actions">
          <button 
            onClick={testWebhook} 
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw size={16} />
            Tester la configuration
          </button>
          {config && (
            <button 
              onClick={deleteWebhook} 
              className="btn-danger"
              disabled={loading}
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          )}
        </div>
        
        <div className="webhook-info">
          <h4>Comment ça marche ?</h4>
          <p>Les webhooks vous permettent de recevoir des mises à jour en temps réel des statuts de vos colis, y compris les statuts secondaires (REFUSE, NOANSWER, etc.)</p>
          <ul>
            <li>✓ Mise à jour automatique des statuts</li>
            <li>✓ Réception des statuts secondaires</li>
            <li>✓ Pas besoin d'interrogation manuelle</li>
            <li>✓ Notifications instantanées</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main AdminOrders Component
export default function AdminOrders() {
  const dispatch = useDispatch();
  const { list: orderList = [], loading } = useSelector((state) => state.commandes);
  
  // Page view states
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit', 'details'
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Prompt states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  
  // Tracking info for all orders
  const [trackingInfoMap, setTrackingInfoMap] = useState({});
  const [loadingTracking, setLoadingTracking] = useState(false);
  
  // Use ref to track if initial fetch has been done
  const initialFetchDone = useRef(false);
  const fetchInProgress = useRef(false);

  // Initial fetch of orders - FIXED: Now with async/await to ensure orders are loaded
  useEffect(() => {
    const loadOrders = async () => {
      try {
        console.log("📦 Fetching orders...");
        await dispatch(fetchCommandes()).unwrap();
        initialFetchDone.current = false; // allow tracking fetch
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    };

    loadOrders();
  }, [dispatch]);

  // Reset tracking when page refreshes
  useEffect(() => {
    initialFetchDone.current = false;
    fetchInProgress.current = false;
    setTrackingInfoMap({}); // Clear existing tracking info
  }, []);

  // OPTIMIZED: Fetch tracking info with rate limiting and error handling
  useEffect(() => {
    const fetchAllTrackingInfo = async () => {
      // Don't fetch if no orders or fetch in progress
      if (orderList.length === 0 || fetchInProgress.current) {
        return;
      }
      
      // Don't fetch if we already have tracking info for all orders
      const allOrdersHaveTracking = orderList.every(order => 
        !order.parcel_code || trackingInfoMap[order.parcel_code]
      );
      
      if (allOrdersHaveTracking && initialFetchDone.current) {
        return;
      }
      
      fetchInProgress.current = true;
      setLoadingTracking(true);
      
      try {
        const token = localStorage.getItem("token");
        const BATCH_SIZE = 3; // Process 3 orders at a time
        const DELAY_MS = 500; // 500ms delay between batches
        
        const newTrackingMap = { ...trackingInfoMap };
        const updatesToDispatch = [];
        
        // Filter orders that need tracking
        const ordersToProcess = orderList.filter(order => 
          order.parcel_code && !newTrackingMap[order.parcel_code]
        );
        
        if (ordersToProcess.length === 0) {
          initialFetchDone.current = true;
          setLoadingTracking(false);
          fetchInProgress.current = false;
          return;
        }
        
        console.log(`📡 Fetching tracking for ${ordersToProcess.length} orders in batches of ${BATCH_SIZE}`);
        
        // Process in batches
        for (let i = 0; i < ordersToProcess.length; i += BATCH_SIZE) {
          const batch = ordersToProcess.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const batchPromises = batch.map(async (order) => {
            try {
              const response = await axios.get(
                `https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/trackparcel`,
                {
                  params: { parcel_code: order.parcel_code },
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  },
                  timeout: 10000 // 10 second timeout per request
                }
              );
              
              if (response.data && response.data.success && response.data.data) {
                const trackingData = response.data.data;
                newTrackingMap[order.parcel_code] = trackingData;
                
                // Check for status changes
                if (trackingData.parcel?.delivery_status) {
                  const deliveryStatus = trackingData.parcel.delivery_status;
                  const secondaryStatus = trackingData.parcel.delivery_status_second;
                  const paymentStatus = trackingData.parcel.payment_status;
                  
                  // If status changed, prepare update
                  if (order.statut !== deliveryStatus || 
                      order.statut_second !== secondaryStatus || 
                      order.payment_status !== paymentStatus) {
                    
                    console.log(`🔔 Status changed for ${order.parcel_code}:`, {
                      old: order.statut,
                      new: deliveryStatus,
                      secondary: secondaryStatus
                    });
                    
                    // Calculate profit
                    const profit = (order.parcel_price || 0) - 
                                  ((order.total || 0) + 
                                   (order.frais_livraison || 0) + 
                                   (order.frais_packaging || 0));
                    
                    // Send webhook update
                    sendWebhookUpdate({
                      parcel: {
                        code: order.parcel_code,
                        status: deliveryStatus,
                        status_second: secondaryStatus,
                        payment_status: paymentStatus
                      }
                    });
                    
                    // Prepare Redux update
                    updatesToDispatch.push(
                      dispatch(updateCommande({ 
                        id: order.id, 
                        statut: deliveryStatus,
                        statut_second: secondaryStatus,
                        payment_status: paymentStatus,
                        profit: profit
                      }))
                    );
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching tracking for ${order.parcel_code}:`, err.message);
              // Don't update tracking map for failed requests
            }
          });
          
          // Wait for batch to complete
          await Promise.all(batchPromises);
          
          // Update tracking map after each batch
          setTrackingInfoMap(newTrackingMap);
          
          // Delay before next batch (except for last batch)
          if (i + BATCH_SIZE < ordersToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          }
        }
        
        // Execute all Redux updates
        if (updatesToDispatch.length > 0) {
          await Promise.all(updatesToDispatch);
        }
        
      } catch (error) {
        console.error("Error in batch tracking fetch:", error);
      } finally {
        setLoadingTracking(false);
        initialFetchDone.current = true;
        fetchInProgress.current = false;
      }
    };

    fetchAllTrackingInfo();
  }, [orderList, dispatch]); // Remove trackingInfoMap from dependencies

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const copyTrackingLink = (parcelCode) => {
    const link = `${window.location.origin}/track/${parcelCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopyMessage(`Lien de suivi copié : ${link}`);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
    });
  };

  const handleDelete = (order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      dispatch(deleteCommande(orderToDelete.id));
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setCurrentView('details');
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setCurrentView('edit');
  };

  const handleAdd = () => {
    setCurrentView('add');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedOrder(null);
  };

  const handleUpdateSubmit = async (id, updateData) => {
    await dispatch(updateCommande({ id, ...updateData })).unwrap();
    await dispatch(fetchCommandes());
  };

  const handleCreateSubmit = async (orderToCreate) => {
    await dispatch(createCommande(orderToCreate)).unwrap();
    await dispatch(fetchCommandes());
  };

 // Then update the filteredOrders useMemo:
const filteredOrders = useMemo(() => {
  // Normalize search term once
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  
  return orderList.filter(order => {
    const matchesSearch = searchTerm === "" || 
      normalizeArabicText(order.parcel_code || "").includes(normalizedSearchTerm) ||
      normalizeArabicText(order.parcel_receiver || "").includes(normalizedSearchTerm) ||
      normalizeArabicText(order.parcel_city || "").includes(normalizedSearchTerm) ||
      normalizeArabicText(order.parcel_phone || "").includes(normalizedSearchTerm);
    
    const matchesStatus = statusFilter === "all" || 
      order.statut === statusFilter || 
      order.statut_second === statusFilter;
    
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

  // Get unique statuses from orders for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    orderList.forEach(order => {
      if (order.statut) {
        statuses.add(order.statut);
      }
      if (order.statut_second && order.statut_second !== '') {
        statuses.add(order.statut_second);
      }
    });
    return Array.from(statuses).sort();
  }, [orderList]);

  // Calculate stats dynamically from orderList
  const stats = useMemo(() => {
    const statsMap = {};
    orderList.forEach(order => {
      if (order.statut) {
        const translated = translateStatus(order.statut);
        statsMap[translated] = (statsMap[translated] || 0) + 1;
      }
      if (order.statut_second && order.statut_second !== '') {
        const key = `${translateStatus(order.statut_second)} (secondaire)`;
        statsMap[key] = (statsMap[key] || 0) + 1;
      }
    });
    return statsMap;
  }, [orderList]);

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

  // Helper to get tracking info for an order - FIXED to use delivery_status_second
  const getTrackingStatus = (parcelCode) => {
    if (!parcelCode) return null;
    const info = trackingInfoMap[parcelCode];
    if (!info || !info.parcel) return null;
    
    return {
      deliveryStatus: info.parcel.delivery_status,
      secondaryStatus: info.parcel.delivery_status_second, // Fixed: use delivery_status_second
      paymentStatus: info.parcel.payment_status,
      paymentText: info.parcel.payment_status_text,
      displayStatus: info.parcel.delivery_status_second 
        ? `${info.parcel.delivery_status} - ${info.parcel.delivery_status_second}` // Fixed
        : info.parcel.delivery_status
    };
  };

  if (loading) {
    return <div className="admin-loading">Chargement des commandes...</div>;
  }

  // Render the appropriate view
  if (currentView === 'details' && selectedOrder) {
    return (
      <div className="admin-orders">
        <DeleteConfirmationModal 
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setOrderToDelete(null);
          }}
          onConfirm={confirmDelete}
          orderCode={orderToDelete?.parcel_code}
        />
        <CopyNotification 
          message={copyMessage}
          isVisible={showCopyNotification}
          onClose={() => setShowCopyNotification(false)}
        />
        <OrderDetailsPage 
          order={selectedOrder} 
          onBack={handleBackToList} 
        />
      </div>
    );
  }

  if (currentView === 'edit' && selectedOrder) {
    return (
      <div className="admin-orders">
        <DeleteConfirmationModal 
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setOrderToDelete(null);
          }}
          onConfirm={confirmDelete}
          orderCode={orderToDelete?.parcel_code}
        />
        <CopyNotification 
          message={copyMessage}
          isVisible={showCopyNotification}
          onClose={() => setShowCopyNotification(false)}
        />
        <UpdateOrderPage 
          order={selectedOrder} 
          onBack={handleBackToList} 
          onSubmit={handleUpdateSubmit}
        />
      </div>
    );
  }

  if (currentView === 'add') {
    return (
      <div className="admin-orders">
        <DeleteConfirmationModal 
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setOrderToDelete(null);
          }}
          onConfirm={confirmDelete}
          orderCode={orderToDelete?.parcel_code}
        />
        <CopyNotification 
          message={copyMessage}
          isVisible={showCopyNotification}
          onClose={() => setShowCopyNotification(false)}
        />
        <AddOrderPage 
          onBack={handleBackToList} 
          onSubmit={handleCreateSubmit}
        />
      </div>
    );
  }

  // Default: List view
  return (
    <div className="admin-orders">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDelete}
        orderCode={orderToDelete?.parcel_code}
      />

      {/* Copy Notification */}
      <CopyNotification 
        message={copyMessage}
        isVisible={showCopyNotification}
        onClose={() => setShowCopyNotification(false)}
      />

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
        
        <div className="header-actions">
          <button 
            onClick={() => setShowWebhookPanel(true)} 
            className="btn-webhook"
            title="Configuration Webhook"
          >
            <Bell size={20} />
            Webhook
          </button>
          <button onClick={handleAdd} className="btn-add-order">
            <Plus size={20} />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Webhook Panel Modal */}
      {showWebhookPanel && (
        <div className="modal-overlay" onClick={() => setShowWebhookPanel(false)}>
          <div className="webhook-modal" onClick={e => e.stopPropagation()}>
            <WebhookTestPanel onClose={() => setShowWebhookPanel(false)} />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="orders-stats-grid">
        <div className="order-stat-card total">
          <div className="order-stat-content">
            <span className="order-stat-label">Total commandes</span>
            <span className="order-stat-value">{orderList.length}</span>
          </div>
        </div>
        {Object.entries(stats).slice(0, 5).map(([status, count]) => (
          <div key={status} className="order-stat-card">
            <div className="order-stat-content">
              <span 
                className="order-stat-label" 
                style={{ color: getStatusColor(status) }}
              >
                {status}
              </span>
              <span className="order-stat-value">{count}</span>
            </div>
          </div>
        ))}
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
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {translateStatus(status)}
                  </option>
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
                  <th>Quantité</th>
                  <th>Ville</th>
                  <th>Statut Livraison</th>
                  <th>Statut Paiement</th>
                  <th>Prix colis</th>
                  <th>Profit</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => {
                  const tracking = getTrackingStatus(order.parcel_code);
                  const deliveryStatus = tracking?.deliveryStatus || order.statut;
                  const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
                  const paymentStatus = tracking?.paymentStatus || order.payment_status;
                  const paymentText = tracking?.paymentText || order.payment_status_text;
                  
                  // Translate statuses for display
                  const translatedDeliveryStatus = translateStatus(deliveryStatus);
                  const translatedSecondaryStatus = secondaryStatus ? translateStatus(secondaryStatus) : null;
                  const translatedPaymentStatus = translateStatus(paymentStatus);
                  
                  return (
                    <tr key={order.id} className={order.profit < 0 ? 'negative-profit-row' : ''}>
                      <td className="order-code">{order.parcel_code || "-"}</td>
                      <td className="order-client">{order.parcel_receiver || "-"}</td>
                      <td>{order.parcel_phone || "-"}</td>
                      <td className="order-qty">{order.parcel_prd_qty || 0}</td>
                      <td>{order.parcel_city || "-"}</td>
                      <td>
                        {loadingTracking ? (
                          <RefreshCw size={14} className="spinning" />
                        ) : (
                          <div className="status-container">
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: `${getStatusColor(deliveryStatus)}15`,
                                color: getStatusColor(deliveryStatus),
                                border: `1px solid ${getStatusColor(deliveryStatus)}30`
                              }}
                            >
                              {translatedDeliveryStatus}
                            </span>
                            {secondaryStatus && secondaryStatus !== '' && (
                              <span 
                                className="status-badge secondary"
                                style={{ 
                                  backgroundColor: `${getStatusColor(secondaryStatus)}15`,
                                  color: getStatusColor(secondaryStatus),
                                  border: `1px solid ${getStatusColor(secondaryStatus)}30`,
                                  marginLeft: '4px'
                                }}
                              >
                                {translatedSecondaryStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {loadingTracking ? (
                          <RefreshCw size={14} className="spinning" />
                        ) : (
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: `${getStatusColor(paymentStatus)}15`,
                              color: getStatusColor(paymentStatus),
                              border: `1px solid ${getStatusColor(paymentStatus)}30`
                            }}
                          >
                            {translatedPaymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="order-pri">{order.parcel_price ? `${order.parcel_price} MAD` : "-"}</td>
                      <td className={`order-profit ${order.profit < 0 ? 'negative' : ''}`}>
                        {order.profit ? `${order.profit} MAD` : "0 MAD"}
                        {order.profit < 0 && <span className="loss-badge">Perte</span>}
                      </td>
                      <td>{order.date ? new Date(order.date).toLocaleDateString('fr-FR') : "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="btn-icon view"
                            title="Voir détails avec suivi en temps réel"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(order)}
                            className="btn-icon edit"
                            title="Modifier la commande"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(order)}
                            className="btn-icon delete"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => copyTrackingLink(order.parcel_code)}
                            className="btn-icon copy"
                            title="Copier le lien de suivi"
                          >
                            <Copy size={16} />
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
    </div>
  );
}