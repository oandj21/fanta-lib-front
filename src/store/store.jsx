import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ==============================================
// 🎯 Axios Configuration
// ==============================================

const API_URL = "https://fanta-lib-back-production-76f4.up.railway.app/api";

// ✅ API instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  }
});

// Add token from localStorage if exists
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ==============================================
// 🔍 Interceptors for API
// ==============================================

api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('🌐 API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn(`⚠️ API Timeout: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    }
    if (error.response?.status === 419) {
      console.warn('⚠️ CSRF token mismatch');
    }
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthenticated');
    }
    if (error.response?.status === 403) {
      console.warn('⚠️ Forbidden - Account may be inactive');
    }
    console.error(`❌ API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// ==============================================
// 🆘 Error handling helper
// ==============================================

const handleApiError = (error, thunkAPI) => {
  let message = 'Une erreur est survenue';
  
  if (error.response) {
    message = error.response.data?.message || 
              error.response.data?.error || 
              `Erreur ${error.response.status}`;
    
    if (error.response.status === 422) {
      return thunkAPI.rejectWithValue({
        message: error.response.data?.message || 'Validation failed',
        errors: error.response.data?.errors || {}
      });
    }
  } else if (error.request) {
    message = 'Impossible de contacter le serveur';
  } else {
    message = error.message || 'Erreur réseau';
  }
  
  console.error('API Error:', message);
  return thunkAPI.rejectWithValue(message);
};

// ==============================================
// 🔐 AUTH ACTIONS
// ==============================================

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      console.log('🔑 Attempting login...');
      
      const response = await api.post("/login", credentials);

      const { utilisateur, token, message } = response.data;

      if (!utilisateur || !token) {
        throw new Error(message || 'Authentification échouée');
      }

      localStorage.setItem("token", token);
      localStorage.setItem("utilisateur", JSON.stringify(utilisateur));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('✅ Login successful for:', utilisateur.email || utilisateur.username);

      return { utilisateur, token };

    } catch (error) {
      console.error('❌ Login error:', error);

      let message = 'Erreur de connexion';

      if (error.response?.status === 401) {
        message = 'Email ou mot de passe incorrect';
      } else if (error.response?.status === 403) {
        message = 'Votre compte est désactivé';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await api.post("/logout");
      return true;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/user");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 📚 LIVRES ACTIONS
// ==============================================

export const fetchLivres = createAsyncThunk(
  "livres/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/livres");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchLivre = createAsyncThunk(
  "livres/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/livres/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createLivre = createAsyncThunk(
  "livres/create",
  async (formData, thunkAPI) => {
    try {
      const response = await api.post("/livres", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateLivre = createAsyncThunk(
  "livres/update",
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await api.post(`/livres/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteLivre = createAsyncThunk(
  "livres/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/livres/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteLivreImage = createAsyncThunk(
  "livres/deleteImage",
  async ({ id, image }, thunkAPI) => {
    try {
      const response = await api.delete(`/livres/${id}/delete-image`, { data: { image } });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 🛒 COMMANDES ACTIONS
// ==============================================

export const fetchCommandes = createAsyncThunk(
  "commandes/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/commandes");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchCommande = createAsyncThunk(
  "commandes/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/commandes/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createCommande = createAsyncThunk(
  "commandes/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/commandes", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateCommande = createAsyncThunk(
  "commandes/update",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await api.put(`/commandes/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteCommande = createAsyncThunk(
  "commandes/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/commandes/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const markCommandeAsDelivered = createAsyncThunk(
  "commandes/markAsDelivered",
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/commandes/${id}/livrer`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// Mark order as sent/not sent
export const markCommandeAsSent = createAsyncThunk(
  "commandes/markAsSent",
  async ({ id, is_sent }, thunkAPI) => {
    try {
      const response = await api.put(`/commandes/${id}/mark-sent`, { is_sent });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// Check stock status
export const checkStockStatus = createAsyncThunk(
  "commandes/checkStock",
  async (livres, thunkAPI) => {
    try {
      const response = await api.post("/commandes/check-stock", { livres });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ✅ NEW: Fetch status history for a commande
export const fetchStatusHistory = createAsyncThunk(
  "commandes/fetchStatusHistory",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/commandes/${id}/status-history`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ✅ NEW: Get commande with tracking (includes history)
export const fetchCommandeWithTracking = createAsyncThunk(
  "commandes/fetchWithTracking",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/commandes/${id}/with-tracking`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ✅ NEW: Sync all orders statuses
export const syncAllStatuses = createAsyncThunk(
  "commandes/syncAllStatuses",
  async (_, thunkAPI) => {
    try {
      const response = await api.post("/commandes/sync-all-statuses");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 💰 DEPENSES ACTIONS
// ==============================================

export const fetchDepenses = createAsyncThunk(
  "depenses/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/depenses");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchDepense = createAsyncThunk(
  "depenses/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/depenses/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createDepense = createAsyncThunk(
  "depenses/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/depenses", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateDepense = createAsyncThunk(
  "depenses/update",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await api.put(`/depenses/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteDepense = createAsyncThunk(
  "depenses/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/depenses/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 💰 FINANCES ACTIONS
// ==============================================

export const fetchFinances = createAsyncThunk(
  "finances/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/finances");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchFinance = createAsyncThunk(
  "finances/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/finances/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createFinance = createAsyncThunk(
  "finances/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/finances", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateFinance = createAsyncThunk(
  "finances/update",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await api.put(`/finances/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteFinance = createAsyncThunk(
  "finances/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/finances/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 📚 BOOKS TOTAL VALUE ACTION
// ==============================================

export const fetchBooksTotalValue = createAsyncThunk(
  "finances/fetchBooksTotalValue",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/livres");
      const livres = response.data;
      const totalPrixAchat = livres.reduce((sum, livre) => sum + (Number(livre.prix_achat) || 0), 0);
      return totalPrixAchat;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 👥 UTILISATEURS ACTIONS
// ==============================================

export const fetchUtilisateurs = createAsyncThunk(
  "utilisateurs/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/utilisateurs");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createUtilisateur = createAsyncThunk(
  "utilisateurs/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/utilisateurs", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateUtilisateur = createAsyncThunk(
  "utilisateurs/update",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await api.put(`/utilisateurs/${id}`, data);
      return response.data.utilisateur || response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteUtilisateur = createAsyncThunk(
  "utilisateurs/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/utilisateurs/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const toggleUtilisateurStatus = createAsyncThunk(
  "utilisateurs/toggleStatus",
  async (id, thunkAPI) => {
    try {
      const response = await api.patch(`/utilisateurs/${id}/toggle-status`);
      return response.data.utilisateur || response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateUtilisateurRole = createAsyncThunk(
  "utilisateurs/updateRole",
  async ({ id, role }, thunkAPI) => {
    try {
      const response = await api.patch(`/utilisateurs/${id}/role`, { role });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ current_password, new_password }, thunkAPI) => {
    try {
      const response = await api.post("/change-password", {
        current_password,
        new_password
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 📦 COMMANDE FOURNISSEURS ACTIONS
// ==============================================

export const fetchCommandesFournisseur = createAsyncThunk(
  "commandesFournisseur/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/commande-fournisseurs");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchCommandeFournisseur = createAsyncThunk(
  "commandesFournisseur/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/commande-fournisseurs/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createCommandeFournisseur = createAsyncThunk(
  "commandesFournisseur/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/commande-fournisseurs", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const updateCommandeFournisseur = createAsyncThunk(
  "commandesFournisseur/update",
  async ({ id, ...data }, thunkAPI) => {
    try {
      const response = await api.put(`/commande-fournisseurs/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteCommandeFournisseur = createAsyncThunk(
  "commandesFournisseur/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/commande-fournisseurs/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchCommandesByLivre = createAsyncThunk(
  "commandesFournisseur/fetchByLivre",
  async (livreId, thunkAPI) => {
    try {
      const response = await api.get(`/commande-fournisseurs/livre/${livreId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 📊 DASHBOARD STATS ACTIONS
// ==============================================

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchMonthlyStats = createAsyncThunk(
  "dashboard/fetchMonthlyStats",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/dashboard/monthly-stats");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 📧 MESSAGES ACTIONS
// ==============================================

export const fetchMessages = createAsyncThunk(
  "messages/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/messages");
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const fetchMessage = createAsyncThunk(
  "messages/fetchOne",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/messages/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const createMessage = createAsyncThunk(
  "messages/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/messages", data);
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "messages/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/messages/${id}`);
      return id;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

// ==============================================
// 🔐 AUTH SLICE
// ==============================================

const utilisateurLocal = JSON.parse(localStorage.getItem("utilisateur") || 'null');
const tokenLocal = localStorage.getItem("token");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    utilisateur: utilisateurLocal || null,
    token: tokenLocal || null,
    loading: false,
    error: null,
    isAuthenticated: !!utilisateurLocal && !!tokenLocal,
    isActive: !!utilisateurLocal && utilisateurLocal.is_active !== false
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.utilisateur = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isActive = false;
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem("utilisateur");
      localStorage.removeItem("token");
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.utilisateur = action.payload.utilisateur;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isActive = action.payload.utilisateur.is_active !== false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.utilisateur = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isActive = false;
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem("utilisateur");
        localStorage.removeItem("token");
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.utilisateur = action.payload;
        state.isAuthenticated = true;
        state.isActive = action.payload.is_active !== false;
        localStorage.setItem("utilisateur", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.utilisateur = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isActive = false;
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem("utilisateur");
        localStorage.removeItem("token");
      });
  }
});

// ==============================================
// 📚 LIVRES SLICE
// ==============================================

const livresSlice = createSlice({
  name: "livres",
  initialState: {
    list: [],
    currentLivre: null,
    loading: false,
    error: null
  },
  reducers: {
    clearLivreError: (state) => {
      state.error = null;
    },
    clearCurrentLivre: (state) => {
      state.currentLivre = null;
    },
    updateLivreStock: (state, action) => {
      const { id, stock } = action.payload;
      const livre = state.list.find(l => l.id === id);
      if (livre) {
        livre.stock = stock;
      }
      if (state.currentLivre?.id === id) {
        state.currentLivre.stock = stock;
      }
    },
    toggleLivreRunning: (state, action) => {
      const { id, is_running } = action.payload;
      const livre = state.list.find(l => l.id === id);
      if (livre) {
        livre.is_running = is_running;
      }
      if (state.currentLivre?.id === id) {
        state.currentLivre.is_running = is_running;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLivres.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLivres.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLivres.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
      .addCase(fetchLivre.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLivre.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLivre = action.payload;
      })
      .addCase(fetchLivre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLivre.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLivre.fulfilled, (state, action) => {
        state.loading = false;
        const newLivre = action.payload.data || action.payload;
        if (newLivre && newLivre.id) {
          state.list.push(newLivre);
        }
      })
      .addCase(createLivre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLivre.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLivre.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLivre = action.payload.data || action.payload;
        if (updatedLivre && updatedLivre.id) {
          const index = state.list.findIndex(l => l.id === updatedLivre.id);
          if (index !== -1) {
            state.list[index] = updatedLivre;
          }
          state.currentLivre = updatedLivre;
        }
      })
      .addCase(updateLivre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLivre.fulfilled, (state, action) => {
        state.list = state.list.filter(l => l.id !== action.payload);
        if (state.currentLivre?.id === action.payload) {
          state.currentLivre = null;
        }
      })
      .addCase(deleteLivreImage.fulfilled, (state, action) => {
        const updatedLivre = action.payload.data || action.payload;
        if (updatedLivre && updatedLivre.id) {
          const index = state.list.findIndex(l => l.id === updatedLivre.id);
          if (index !== -1) {
            state.list[index] = updatedLivre;
          }
          if (state.currentLivre?.id === updatedLivre.id) {
            state.currentLivre = updatedLivre;
          }
        }
      });
  }
});

// ==============================================
// 🛒 COMMANDES SLICE (UPDATED with status history)
// ==============================================

const commandesSlice = createSlice({
  name: "commandes",
  initialState: {
    list: [],
    currentCommande: null,
    statusHistory: [], // Store status history for current commande
    loading: false,
    error: null,
    syncProgress: {
      isSyncing: false,
      updated: 0,
      failed: 0,
      total: 0
    }
  },
  reducers: {
    clearCommandeError: (state) => {
      state.error = null;
    },
    clearCurrentCommande: (state) => {
      state.currentCommande = null;
      state.statusHistory = [];
    },
    // ✅ NEW: Update status history locally
    updateCommandeStatus: (state, action) => {
      const { id, statut, statut_second, status_historique, statut_display } = action.payload;
      const commande = state.list.find(c => c.id === id);
      if (commande) {
        commande.statut = statut;
        commande.statut_second = statut_second;
        commande.status_historique = status_historique;
        commande.statut_display = statut_display || (statut_second && statut_second !== '' 
          ? `${statut} - ${statut_second}` 
          : statut);
      }
      if (state.currentCommande?.id === id) {
        state.currentCommande.statut = statut;
        state.currentCommande.statut_second = statut_second;
        state.currentCommande.status_historique = status_historique;
        state.currentCommande.statut_display = statut_display || (statut_second && statut_second !== '' 
          ? `${statut} - ${statut_second}` 
          : statut);
        state.statusHistory = status_historique || [];
      }
    },
    // ✅ NEW: Add a single status change
    addStatusChange: (state, action) => {
      const { id, statusChange } = action.payload;
      const commande = state.list.find(c => c.id === id);
      if (commande) {
        if (!commande.status_historique) commande.status_historique = [];
        commande.status_historique.push(statusChange);
        // Update display status if needed
        if (statusChange.new_status) {
          commande.statut = statusChange.new_status;
          commande.statut_second = statusChange.new_status_second;
          commande.statut_display = statusChange.new_status_second && statusChange.new_status_second !== ''
            ? `${statusChange.new_status} - ${statusChange.new_status_second}`
            : statusChange.new_status;
        }
      }
      if (state.currentCommande?.id === id) {
        if (!state.currentCommande.status_historique) state.currentCommande.status_historique = [];
        state.currentCommande.status_historique.push(statusChange);
        state.statusHistory = state.currentCommande.status_historique;
        if (statusChange.new_status) {
          state.currentCommande.statut = statusChange.new_status;
          state.currentCommande.statut_second = statusChange.new_status_second;
          state.currentCommande.statut_display = statusChange.new_status_second && statusChange.new_status_second !== ''
            ? `${statusChange.new_status} - ${statusChange.new_status_second}`
            : statusChange.new_status;
        }
      }
    },
    // ✅ NEW: Clear sync progress
    clearSyncProgress: (state) => {
      state.syncProgress = {
        isSyncing: false,
        updated: 0,
        failed: 0,
        total: 0
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all commandes
      .addCase(fetchCommandes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommandes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCommandes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single commande
      .addCase(fetchCommande.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommande.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCommande = action.payload;
        state.statusHistory = action.payload.status_historique || [];
      })
      .addCase(fetchCommande.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create commande
      .addCase(createCommande.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCommande.fulfilled, (state, action) => {
        state.loading = false;
        const newCommande = action.payload.data || action.payload;
        if (newCommande && newCommande.id) {
          state.list.unshift(newCommande);
        }
      })
      .addCase(createCommande.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update commande
      .addCase(updateCommande.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCommande.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCommande = action.payload.data || action.payload;
        if (updatedCommande && updatedCommande.id) {
          const index = state.list.findIndex(c => c.id === updatedCommande.id);
          if (index !== -1) {
            state.list[index] = updatedCommande;
          }
          state.currentCommande = updatedCommande;
          state.statusHistory = updatedCommande.status_historique || [];
        }
      })
      .addCase(updateCommande.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete commande
      .addCase(deleteCommande.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
        if (state.currentCommande?.id === action.payload) {
          state.currentCommande = null;
          state.statusHistory = [];
        }
      })
      // Mark as delivered
      .addCase(markCommandeAsDelivered.fulfilled, (state, action) => {
        const updatedCommande = action.payload.data || action.payload;
        if (updatedCommande && updatedCommande.id) {
          const index = state.list.findIndex(c => c.id === updatedCommande.id);
          if (index !== -1) {
            state.list[index] = updatedCommande;
          }
          if (state.currentCommande?.id === updatedCommande.id) {
            state.currentCommande = updatedCommande;
            state.statusHistory = updatedCommande.status_historique || [];
          }
        }
      })
      // Mark as sent/not sent
      .addCase(markCommandeAsSent.fulfilled, (state, action) => {
        const updatedCommande = action.payload.data || action.payload;
        if (updatedCommande && updatedCommande.id) {
          const index = state.list.findIndex(c => c.id === updatedCommande.id);
          if (index !== -1) {
            state.list[index] = updatedCommande;
          }
          if (state.currentCommande?.id === updatedCommande.id) {
            state.currentCommande = updatedCommande;
          }
        }
      })
      // ✅ NEW: Fetch status history
      .addCase(fetchStatusHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatusHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.statusHistory = action.payload.status_history || [];
      })
      .addCase(fetchStatusHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ NEW: Fetch commande with tracking
      .addCase(fetchCommandeWithTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommandeWithTracking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCommande = action.payload.order;
        state.statusHistory = action.payload.order.status_historique || [];
        state.trackingData = action.payload.tracking;
      })
      .addCase(fetchCommandeWithTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ NEW: Sync all statuses
      .addCase(syncAllStatuses.pending, (state) => {
        state.syncProgress.isSyncing = true;
        state.syncProgress.updated = 0;
        state.syncProgress.failed = 0;
        state.error = null;
      })
      .addCase(syncAllStatuses.fulfilled, (state, action) => {
        state.syncProgress.isSyncing = false;
        state.syncProgress.updated = action.payload.updated || 0;
        state.syncProgress.failed = action.payload.failed || 0;
        state.syncProgress.total = action.payload.total || 0;
        // Update the list with synced data if returned
        if (action.payload.results) {
          action.payload.results.forEach(result => {
            if (result.success && result.new_status) {
              const commande = state.list.find(c => c.parcel_code === result.parcel_code);
              if (commande) {
                commande.statut = result.new_status;
                commande.statut_second = result.new_secondary;
                commande.statut_display = result.new_secondary && result.new_secondary !== ''
                  ? `${result.new_status} - ${result.new_secondary}`
                  : result.new_status;
              }
            }
          });
        }
      })
      .addCase(syncAllStatuses.rejected, (state, action) => {
        state.syncProgress.isSyncing = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 💰 DEPENSES SLICE
// ==============================================

const depensesSlice = createSlice({
  name: "depenses",
  initialState: {
    list: [],
    currentDepense: null,
    loading: false,
    error: null
  },
  reducers: {
    clearDepenseError: (state) => {
      state.error = null;
    },
    clearCurrentDepense: (state) => {
      state.currentDepense = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepenses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchDepenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDepense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepense.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDepense = action.payload;
      })
      .addCase(fetchDepense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDepense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepense.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload.data || action.payload);
      })
      .addCase(createDepense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateDepense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepense.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDepense = action.payload.data || action.payload;
        const index = state.list.findIndex(d => d.id === updatedDepense.id);
        if (index !== -1) {
          state.list[index] = updatedDepense;
        }
        state.currentDepense = updatedDepense;
      })
      .addCase(updateDepense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteDepense.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload);
        if (state.currentDepense?.id === action.payload) {
          state.currentDepense = null;
        }
      });
  }
});

// ==============================================
// 💰 FINANCES SLICE
// ==============================================

const financesSlice = createSlice({
  name: "finances",
  initialState: {
    list: [],
    currentFinance: null,
    totalBooksValue: 0,
    loading: false,
    error: null
  },
  reducers: {
    clearFinanceError: (state) => {
      state.error = null;
    },
    clearCurrentFinance: (state) => {
      state.currentFinance = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinances.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        if (action.payload && action.payload.length > 0) {
          state.currentFinance = action.payload[0];
        }
      })
      .addCase(fetchFinances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFinance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinance.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFinance = action.payload;
      })
      .addCase(fetchFinance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFinance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFinance.fulfilled, (state, action) => {
        state.loading = false;
        const newFinance = action.payload.data || action.payload;
        if (newFinance && newFinance.id) {
          state.list.push(newFinance);
          state.currentFinance = newFinance;
        }
      })
      .addCase(createFinance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateFinance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFinance.fulfilled, (state, action) => {
        state.loading = false;
        const updatedFinance = action.payload.data || action.payload;
        if (updatedFinance && updatedFinance.id) {
          const index = state.list.findIndex(f => f.id === updatedFinance.id);
          if (index !== -1) {
            state.list[index] = updatedFinance;
          }
          state.currentFinance = updatedFinance;
        }
      })
      .addCase(updateFinance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteFinance.fulfilled, (state, action) => {
        state.list = state.list.filter(f => f.id !== action.payload);
        if (state.currentFinance?.id === action.payload) {
          state.currentFinance = null;
        }
      })
      .addCase(fetchBooksTotalValue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooksTotalValue.fulfilled, (state, action) => {
        state.loading = false;
        state.totalBooksValue = action.payload;
      })
      .addCase(fetchBooksTotalValue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 👥 UTILISATEURS SLICE
// ==============================================

const utilisateursSlice = createSlice({
  name: "utilisateurs",
  initialState: {
    list: [],
    currentUtilisateur: null,
    loading: false,
    error: null
  },
  reducers: {
    clearUtilisateurError: (state) => {
      state.error = null;
    },
    clearCurrentUtilisateur: (state) => {
      state.currentUtilisateur = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUtilisateurs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUtilisateurs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : 
                    action.payload.data ? action.payload.data : [];
      })
      .addCase(fetchUtilisateurs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
      .addCase(createUtilisateur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUtilisateur.fulfilled, (state, action) => {
        state.loading = false;
        const newUser = action.payload.utilisateur || action.payload.data || action.payload;
        if (newUser && newUser.id) {
          state.list.push(newUser);
        }
      })
      .addCase(createUtilisateur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUtilisateur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUtilisateur.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.utilisateur || action.payload.data || action.payload;
        if (updatedUser && updatedUser.id) {
          const index = state.list.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            state.list[index] = updatedUser;
          }
          state.currentUtilisateur = updatedUser;
        }
      })
      .addCase(updateUtilisateur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUtilisateur.fulfilled, (state, action) => {
        state.list = state.list.filter(u => u.id !== action.payload);
        if (state.currentUtilisateur?.id === action.payload) {
          state.currentUtilisateur = null;
        }
      })
      .addCase(toggleUtilisateurStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUtilisateurStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload.utilisateur || action.payload.data || action.payload;
        if (updatedUser && updatedUser.id) {
          const index = state.list.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            state.list[index] = updatedUser;
          }
          if (state.currentUtilisateur?.id === updatedUser.id) {
            state.currentUtilisateur = updatedUser;
          }
        }
      })
      .addCase(toggleUtilisateurStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUtilisateurRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUtilisateurRole.fulfilled, (state, action) => {
        state.loading = false;
        const { id, role } = action.payload;
        const index = state.list.findIndex(u => u.id === id);
        if (index !== -1) {
          state.list[index].role = role;
        }
        if (state.currentUtilisateur?.id === id) {
          state.currentUtilisateur.role = role;
        }
      })
      .addCase(updateUtilisateurRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 📦 COMMANDE FOURNISSEURS SLICE
// ==============================================

const commandesFournisseurSlice = createSlice({
  name: "commandesFournisseur",
  initialState: {
    list: [],
    currentCommande: null,
    loading: false,
    error: null
  },
  reducers: {
    clearCommandeFournisseurError: (state) => {
      state.error = null;
    },
    clearCurrentCommandeFournisseur: (state) => {
      state.currentCommande = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommandesFournisseur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommandesFournisseur.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCommandesFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
      .addCase(fetchCommandeFournisseur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommandeFournisseur.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCommande = action.payload;
      })
      .addCase(fetchCommandeFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCommandeFournisseur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCommandeFournisseur.fulfilled, (state, action) => {
        state.loading = false;
        const newCommande = action.payload.data || action.payload;
        if (newCommande && newCommande.id) {
          state.list.push(newCommande);
        }
      })
      .addCase(createCommandeFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCommandeFournisseur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCommandeFournisseur.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCommande = action.payload.data || action.payload;
        if (updatedCommande && updatedCommande.id) {
          const index = state.list.findIndex(c => c.id === updatedCommande.id);
          if (index !== -1) {
            state.list[index] = updatedCommande;
          }
          state.currentCommande = updatedCommande;
        }
      })
      .addCase(updateCommandeFournisseur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCommandeFournisseur.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
        if (state.currentCommande?.id === action.payload) {
          state.currentCommande = null;
        }
      })
      .addCase(fetchCommandesByLivre.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommandesByLivre.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCommandesByLivre.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 📧 MESSAGES SLICE
// ==============================================

const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    list: [],
    currentMessage: null,
    loading: false,
    error: null
  },
  reducers: {
    clearMessageError: (state) => {
      state.error = null;
    },
    clearCurrentMessage: (state) => {
      state.currentMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
      .addCase(fetchMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMessage = action.payload;
      })
      .addCase(fetchMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.loading = false;
        const newMessage = action.payload.data || action.payload;
        if (newMessage && newMessage.id) {
          state.list.unshift(newMessage);
        }
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(m => m.id !== action.payload);
        if (state.currentMessage?.id === action.payload) {
          state.currentMessage = null;
        }
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 📊 DASHBOARD SLICE
// ==============================================

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: {
      total_sales: 0,
      total_profit: 0,
      total_expenses: 0,
      net_income: 0
    },
    monthlyStats: [],
    loading: false,
    error: null
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMonthlyStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyStats = action.payload;
      })
      .addCase(fetchMonthlyStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// ==============================================
// 🏪 Configure Redux Store
// ==============================================

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    livres: livresSlice.reducer,
    commandes: commandesSlice.reducer,
    depenses: depensesSlice.reducer,
    finances: financesSlice.reducer,
    utilisateurs: utilisateursSlice.reducer,
    messages: messagesSlice.reducer,
    dashboard: dashboardSlice.reducer,
    commandesFournisseur: commandesFournisseurSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: {
        extraArgument: { api }
      }
    })
});

// ==============================================
// 🏗 Export actions
// ==============================================

// Auth actions
export const { clearAuthError, logout: logoutFromSlice } = authSlice.actions;

// Livres actions
export const { 
  clearLivreError, 
  clearCurrentLivre,
  updateLivreStock,
  toggleLivreRunning
} = livresSlice.actions;

// Commandes actions (updated)
export const { 
  clearCommandeError, 
  clearCurrentCommande,
  updateCommandeStatus,
  addStatusChange,
  clearSyncProgress
} = commandesSlice.actions;

// Depenses actions
export const { clearDepenseError, clearCurrentDepense } = depensesSlice.actions;

// Finances actions
export const { clearFinanceError, clearCurrentFinance } = financesSlice.actions;

// Utilisateurs actions
export const { clearUtilisateurError, clearCurrentUtilisateur } = utilisateursSlice.actions;

// Messages actions
export const { clearMessageError, clearCurrentMessage } = messagesSlice.actions;

// Dashboard actions
export const { clearDashboardError } = dashboardSlice.actions;

// Commandes Fournisseur actions
export const { 
  clearCommandeFournisseurError, 
  clearCurrentCommandeFournisseur 
} = commandesFournisseurSlice.actions;

// ==============================================
// 🎯 Selectors
// ==============================================

// Auth selectors
export const selectAuthUser = (state) => state.auth.utilisateur;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsActive = (state) => state.auth.isActive;

// Livres selectors
export const selectLivres = (state) => state.livres.list;
export const selectCurrentLivre = (state) => state.livres.currentLivre;
export const selectLivresLoading = (state) => state.livres.loading;
export const selectLivresError = (state) => state.livres.error;

// New selectors for is_running and stock
export const selectLivreStock = (state, livreId) => {
  const livre = state.livres.list.find(l => l.id === livreId);
  return livre?.stock ?? 0;
};

export const selectLivreIsRunning = (state, livreId) => {
  const livre = state.livres.list.find(l => l.id === livreId);
  return livre?.is_running ?? false;
};

export const selectLowStockLivres = (state, threshold = 10) => {
  return state.livres.list.filter(livre => livre.stock <= threshold);
};

export const selectRunningLivres = (state) => {
  return state.livres.list.filter(livre => livre.is_running === true);
};

export const selectOutOfStockLivres = (state) => {
  return state.livres.list.filter(livre => livre.stock === 0);
};

// Commandes selectors (updated)
export const selectCommandes = (state) => state.commandes.list;
export const selectCurrentCommande = (state) => state.commandes.currentCommande;
export const selectCommandesLoading = (state) => state.commandes.loading;
export const selectCommandesError = (state) => state.commandes.error;
export const selectStatusHistory = (state) => state.commandes.statusHistory;
export const selectSyncProgress = (state) => state.commandes.syncProgress;

// ✅ NEW: Helper selector to get formatted status history
export const selectFormattedStatusHistory = (state) => {
  const history = state.commandes.statusHistory;
  if (!history || !Array.isArray(history)) return [];
  
  return history.map(entry => ({
    ...entry,
    formattedOld: entry.old_status && entry.old_status_second 
      ? `${entry.old_status} - ${entry.old_status_second}`
      : entry.old_status,
    formattedNew: entry.new_status && entry.new_status_second 
      ? `${entry.new_status} - ${entry.new_status_second}`
      : entry.new_status,
    changedAtFormatted: entry.changed_at ? new Date(entry.changed_at).toLocaleString() : null,
    sourceIcon: entry.source === 'webhook' ? '🔔' : 
                 entry.source === 'manual_update' ? '✏️' :
                 entry.source === 'tracking_api' ? '📍' :
                 entry.source === 'batch_sync' ? '🔄' :
                 entry.source === 'creation' ? '➕' : '📝'
  }));
};

// ✅ NEW: Selector to get last status change
export const selectLastStatusChange = (state) => {
  const history = state.commandes.statusHistory;
  if (!history || history.length === 0) return null;
  return history[history.length - 1];
};

// ✅ NEW: Selector to get status change count
export const selectStatusChangesCount = (state) => {
  return state.commandes.statusHistory?.length || 0;
};

// Depenses selectors
export const selectDepenses = (state) => state.depenses.list;
export const selectCurrentDepense = (state) => state.depenses.currentDepense;
export const selectDepensesLoading = (state) => state.depenses.loading;
export const selectDepensesError = (state) => state.depenses.error;

// Finances selectors
export const selectFinances = (state) => state.finances.list;
export const selectCurrentFinance = (state) => state.finances.currentFinance;
export const selectTotalBooksValue = (state) => state.finances.totalBooksValue;
export const selectFinancesLoading = (state) => state.finances.loading;
export const selectFinancesError = (state) => state.finances.error;

// Utilisateurs selectors
export const selectUtilisateurs = (state) => state.utilisateurs.list;
export const selectCurrentUtilisateur = (state) => state.utilisateurs.currentUtilisateur;
export const selectUtilisateursLoading = (state) => state.utilisateurs.loading;
export const selectUtilisateursError = (state) => state.utilisateurs.error;

// Messages selectors
export const selectMessages = (state) => state.messages.list;
export const selectCurrentMessage = (state) => state.messages.currentMessage;
export const selectMessagesLoading = (state) => state.messages.loading;
export const selectMessagesError = (state) => state.messages.error;

// Dashboard selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectMonthlyStats = (state) => state.dashboard.monthlyStats;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;

// Commandes Fournisseur selectors
export const selectCommandesFournisseur = (state) => state.commandesFournisseur.list;
export const selectCurrentCommandeFournisseur = (state) => state.commandesFournisseur.currentCommande;
export const selectCommandesFournisseurLoading = (state) => state.commandesFournisseur.loading;
export const selectCommandesFournisseurError = (state) => state.commandesFournisseur.error;

export default store;