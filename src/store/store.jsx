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
// 📚 BOOKS TOTAL VALUE ACTION (ADD THIS)
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all livres
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
      // Fetch single livre
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
      // Create livre
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
      // Update livre
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
      // Delete livre
      .addCase(deleteLivre.fulfilled, (state, action) => {
        state.list = state.list.filter(l => l.id !== action.payload);
        if (state.currentLivre?.id === action.payload) {
          state.currentLivre = null;
        }
      })
      // Delete livre image
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
// 🛒 COMMANDES SLICE
// ==============================================

const commandesSlice = createSlice({
  name: "commandes",
  initialState: {
    list: [],
    currentCommande: null,
    loading: false,
    error: null
  },
  reducers: {
    clearCommandeError: (state) => {
      state.error = null;
    },
    clearCurrentCommande: (state) => {
      state.currentCommande = null;
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
        state.list.push(action.payload.data || action.payload);
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
        const index = state.list.findIndex(c => c.id === updatedCommande.id);
        if (index !== -1) {
          state.list[index] = updatedCommande;
        }
        state.currentCommande = updatedCommande;
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
        }
      })
      // Mark as delivered
      .addCase(markCommandeAsDelivered.fulfilled, (state, action) => {
        const updatedCommande = action.payload.data || action.payload;
        const index = state.list.findIndex(c => c.id === updatedCommande.id);
        if (index !== -1) {
          state.list[index] = updatedCommande;
        }
        if (state.currentCommande?.id === updatedCommande.id) {
          state.currentCommande = updatedCommande;
        }
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
      // Fetch all depenses
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
      // Fetch single depense
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
      // Create depense
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
      // Update depense
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
      // Delete depense
      .addCase(deleteDepense.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload);
        if (state.currentDepense?.id === action.payload) {
          state.currentDepense = null;
        }
      });
  }
});

// ==============================================
// 💰 FINANCES SLICE (UPDATED WITH TOTAL BOOKS VALUE)
// ==============================================

const financesSlice = createSlice({
  name: "finances",
  initialState: {
    list: [],
    currentFinance: null,
    totalBooksValue: 0, // ADD THIS
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
      // Fetch all finances
      .addCase(fetchFinances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinances.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        // Get the latest finance record for capital
        if (action.payload && action.payload.length > 0) {
          state.currentFinance = action.payload[0]; // Assuming you want the latest
        }
      })
      .addCase(fetchFinances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single finance
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
      // Create finance
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
      // Update finance
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
      // Delete finance
      .addCase(deleteFinance.fulfilled, (state, action) => {
        state.list = state.list.filter(f => f.id !== action.payload);
        if (state.currentFinance?.id === action.payload) {
          state.currentFinance = null;
        }
      })
      // ADD THIS: Fetch books total value
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
      // Fetch all utilisateurs
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
      // Create utilisateur
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
      // Update utilisateur
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
      // Delete utilisateur
      .addCase(deleteUtilisateur.fulfilled, (state, action) => {
        state.list = state.list.filter(u => u.id !== action.payload);
        if (state.currentUtilisateur?.id === action.payload) {
          state.currentUtilisateur = null;
        }
      })
      // Toggle status
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
      // Update role
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
      // Fetch all messages
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
      // Fetch single message
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
      // Create message
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
      // Delete message
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
    dashboard: dashboardSlice.reducer
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
export const { clearLivreError, clearCurrentLivre } = livresSlice.actions;

// Commandes actions
export const { clearCommandeError, clearCurrentCommande } = commandesSlice.actions;

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

// Commandes selectors
export const selectCommandes = (state) => state.commandes.list;
export const selectCurrentCommande = (state) => state.commandes.currentCommande;
export const selectCommandesLoading = (state) => state.commandes.loading;
export const selectCommandesError = (state) => state.commandes.error;

// Depenses selectors
export const selectDepenses = (state) => state.depenses.list;
export const selectCurrentDepense = (state) => state.depenses.currentDepense;
export const selectDepensesLoading = (state) => state.depenses.loading;
export const selectDepensesError = (state) => state.depenses.error;

// Finances selectors
export const selectFinances = (state) => state.finances.list;
export const selectCurrentFinance = (state) => state.finances.currentFinance;
export const selectTotalBooksValue = (state) => state.finances.totalBooksValue; // ADD THIS
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

export default store;