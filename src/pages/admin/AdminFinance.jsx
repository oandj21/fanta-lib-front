import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  BookOpen,
  Wallet,
  ArrowUpCircle,
  Edit3,
  BarChart3
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from "recharts";
import { 
  fetchDashboardStats, 
  fetchMonthlyStats,
  fetchFinances,
  fetchLivres,
  fetchCommandes,
  fetchDepenses,
  updateFinance,
  createFinance
} from "../../store/store";
import "../../css/AdminFinance.css";

export default function AdminFinance() {
  const dispatch = useDispatch();
  const { stats = {}, monthlyStats = [] } = useSelector((state) => state.dashboard);
  const { currentFinance } = useSelector((state) => state.finances);
  const { list: livresList } = useSelector((state) => state.livres);
  const { list: commandesList } = useSelector((state) => state.commandes);
  const { list: depensesList } = useSelector((state) => state.depenses);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [capitalAmount, setCapitalAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Fetch all necessary data
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchFinances());
    dispatch(fetchLivres());
    dispatch(fetchCommandes());
    dispatch(fetchDepenses());
  }, [dispatch]);

  useEffect(() => {
    if (currentFinance) {
      setCapitalAmount(currentFinance.capital?.toString() || '0');
    }
  }, [currentFinance]);

  // ==============================================
  // 📊 FINANCIAL CALCULATIONS
  // ==============================================

  // Capital from finance table
  const capital = currentFinance?.capital || 0;

  // 1. Calculate total stock value (prix_achat from livres)
  const totalStockValue = livresList.reduce((sum, livre) => {
    return sum + (Number(livre.prix_achat) || 0);
  }, 0);

  // 2. Calculate total profit from all orders (profit from commandes)
  const totalProfit = commandesList.reduce((sum, commande) => {
    // Only count profit from delivered orders
    const deliveredStatuses = ['delivered', 'livrée', 'livree', 'Livré', 'Livrée'];
    if (deliveredStatuses.includes(commande.statut?.toLowerCase())) {
      return sum + (Number(commande.profit) || 0);
    }
    return sum;
  }, 0);

  // 3. Calculate total expenses (montant from depenses)
  const totalExpenses = depensesList.reduce((sum, depense) => {
    return sum + (Number(depense.montant) || 0);
  }, 0);

  // 4. Calculate revenue (total from delivered orders)
  const revenue = commandesList.reduce((sum, commande) => {
    const deliveredStatuses = ['delivered', 'livrée', 'livree', 'Livré', 'Livrée'];
    if (deliveredStatuses.includes(commande.statut?.toLowerCase())) {
      return sum + (Number(commande.total) || 0);
    }
    return sum;
  }, 0);

  // 5. Calculate net gain (profit - expenses)
  const netGain = totalProfit - totalExpenses;

  // 6. Calculate ROI (Return on Investment)
  const roi = capital > 0 ? ((netGain / capital) * 100).toFixed(1) : 0;

  // 7. Calculate profit margin
  const profitMargin = revenue > 0 ? ((totalProfit / revenue) * 100).toFixed(1) : 0;

  // 8. Calculate number of delivered orders
  const deliveredOrdersCount = commandesList.filter(c => {
    const deliveredStatuses = ['delivered', 'livrée', 'livree', 'Livré', 'Livrée'];
    return deliveredStatuses.includes(c.statut?.toLowerCase());
  }).length;

  // 9. Calculate average order value
  const averageOrderValue = deliveredOrdersCount > 0 ? revenue / deliveredOrdersCount : 0;

  // 10. Calculate average profit per order
  const averageProfitPerOrder = deliveredOrdersCount > 0 ? totalProfit / deliveredOrdersCount : 0;

  // Main financial cards
  const mainCards = [
    { 
      label: "Capital Initial", 
      value: capital, 
      icon: Wallet,
      color: "primary",
      description: "Fonds de départ",
      editable: true
    },
    { 
      label: "Valeur du Stock", 
      value: totalStockValue, 
      icon: BookOpen,
      color: "info",
      description: "Prix d'achat total des livres"
    },
    { 
      label: "Profit Total", 
      value: totalProfit, 
      icon: TrendingUp,
      color: "success",
      description: "Bénéfice des ventes réalisées"
    },
    { 
      label: "Dépenses Totales", 
      value: totalExpenses, 
      icon: Receipt,
      color: "danger",
      description: "Coûts opérationnels"
    },
  ];

  const secondaryCards = [
    { 
      label: "Gain Net", 
      value: netGain, 
      icon: DollarSign,
      color: netGain >= 0 ? "success" : "danger",
      description: netGain >= 0 ? "Bénéfice après dépenses" : "Perte nette"
    },
    { 
      label: "Chiffre d'Affaires", 
      value: revenue, 
      icon: BarChart3,
      color: "warning",
      description: "Total des ventes réalisées"
    },
    { 
      label: "Marge Bénéficiaire", 
      value: profitMargin,
      isPercentage: true,
      icon: ArrowUpCircle,
      color: "purple",
      description: "Profit / Chiffre d'affaires"
    },
    { 
      label: "ROI", 
      value: roi,
      isPercentage: true,
      icon: Edit3,
      color: "primary",
      description: "Retour sur investissement"
    },
  ];

  // Format chart data from monthlyStats
  const chartData = monthlyStats.map(item => ({
    month: item.month,
    ventes: Number(item.ventes || 0),
    profit: Number(item.profit || 0),
    depenses: Number(item.depenses || 0),
    net: Number(item.profit || 0) - Number(item.depenses || 0)
  }));

  // Pie chart data for profit breakdown
  const profitBreakdown = [
    { name: 'Gain Net', value: Math.max(netGain, 0), color: '#10b981' },
    { name: 'Dépenses', value: totalExpenses, color: '#ef4444' },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleUpdateCapital = async () => {
    if (!capitalAmount || isNaN(capitalAmount)) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setIsUpdating(true);
    try {
      const amount = parseInt(capitalAmount);
      
      if (currentFinance) {
        await dispatch(updateFinance({ 
          id: currentFinance.id, 
          capital: amount 
        })).unwrap();
      } else {
        await dispatch(createFinance({ 
          capital: amount 
        })).unwrap();
      }
      
      await dispatch(fetchFinances());
      setShowCapitalModal(false);
      alert('Capital mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating capital:', error);
      alert('Erreur lors de la mise à jour du capital');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="admin-finance">
      <div className="finance-header">
        <div className="header-content">
          <h2>Finance & Analytics</h2>
          <p>Analyse financière détaillée de votre activité</p>
        </div>
        <div className="header-actions">
          <button 
            className="update-capital-btn"
            onClick={() => setShowCapitalModal(true)}
          >
            <Edit3 size={18} />
            Mettre à jour le capital
          </button>
        </div>
      </div>

      {/* Capital Update Modal */}
      {showCapitalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Mettre à jour le capital</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCapitalModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="capital">Montant du capital (MAD)</label>
                <input
                  type="number"
                  id="capital"
                  className="capital-input"
                  value={capitalAmount}
                  onChange={(e) => setCapitalAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  min="0"
                  step="100"
                />
              </div>
              <div className="current-capital-info">
                Capital actuel: {formatCurrency(capital)}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCapitalModal(false)}
              >
                Annuler
              </button>
              <button 
                className="save-btn"
                onClick={handleUpdateCapital}
                disabled={isUpdating}
              >
                {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid - 4 cards */}
      <div className="stats-grid main-grid">
        {mainCards.map(({ label, value, icon: Icon, color, description, editable }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">
                {label}
                {editable && (
                  <button 
                    className="edit-icon-btn"
                    onClick={() => setShowCapitalModal(true)}
                    title="Modifier le capital"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </p>
              <h3 className="stat-value">{formatCurrency(value)}</h3>
              <p className="stat-description">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Grid - 4 cards */}
      <div className="stats-grid secondary-grid">
        {secondaryCards.map(({ label, value, icon: Icon, color, description, isPercentage }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{label}</p>
              <h3 className="stat-value">
                {isPercentage ? `${value}%` : formatCurrency(value)}
              </h3>
              <p className="stat-description">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="finance-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={activeTab === 'profitability' ? 'active' : ''} 
          onClick={() => setActiveTab('profitability')}
        >
          Rentabilité
        </button>
        <button 
          className={activeTab === 'charts' ? 'active' : ''} 
          onClick={() => setActiveTab('charts')}
        >
          Graphiques
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          <div className="finance-summary">
            <div className="summary-card">
              <h3>Résumé financier</h3>
              <div className="summary-item">
                <span>Capital initial</span>
                <span className="amount">{formatCurrency(capital)}</span>
              </div>
              <div className="summary-item">
                <span>Valeur du stock</span>
                <span className="amount">{formatCurrency(totalStockValue)}</span>
              </div>
              <div className="summary-item">
                <span>Profit des ventes</span>
                <span className="amount positive">{formatCurrency(totalProfit)}</span>
              </div>
              <div className="summary-item">
                <span>Dépenses totales</span>
                <span className="amount negative">-{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="summary-total">
                <span>Gain net</span>
                <span className={`amount ${netGain >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(netGain)}
                </span>
              </div>
            </div>

            <div className="ratios-card">
              <h3>Indicateurs clés</h3>
              <div className="ratio-item">
                <span className="ratio-label">Marge bénéficiaire</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill" 
                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                  ></div>
                </div>
                <span className="ratio-value">{profitMargin}%</span>
              </div>
              <div className="ratio-item">
                <span className="ratio-label">ROI</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill warning" 
                    style={{ width: `${Math.min(roi, 100)}%` }}
                  ></div>
                </div>
                <span className="ratio-value">{roi}%</span>
              </div>
              <div className="ratio-item">
                <span className="ratio-label">Ratio dépenses/profit</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill danger" 
                    style={{ width: `${totalProfit > 0 ? Math.min((totalExpenses / totalProfit) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <span className="ratio-value">
                  {totalProfit > 0 ? ((totalExpenses / totalProfit) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Répartition des gains</h3>
            <div className="pie-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={profitBreakdown.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {profitBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'profitability' && (
        <div className="profitability-section">
          <div className="profitability-grid">
            <div className="profit-card">
              <h4>Analyse de rentabilité</h4>
              <div className="profit-item">
                <span>Seuil de rentabilité</span>
                <span className="value">{formatCurrency(totalExpenses)}</span>
                <small>Dépenses totales à couvrir</small>
              </div>
              <div className="profit-item">
                <span>Point mort (jours)</span>
                <span className="value">
                  {totalProfit > 0 ? Math.ceil((totalExpenses / totalProfit) * 30) : 0} jours
                </span>
                <small>Temps pour couvrir les dépenses</small>
              </div>
              <div className="profit-item highlight">
                <span>Rentabilité nette</span>
                <span className={`value ${netGain >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(netGain)}
                </span>
                <small>Profit après dépenses</small>
              </div>
            </div>

            <div className="profit-card">
              <h4>Performance commerciale</h4>
              <div className="profit-item">
                <span>Ticket moyen</span>
                <span className="value">{formatCurrency(averageOrderValue)}</span>
                <small>Par commande livrée</small>
              </div>
              <div className="profit-item">
                <span>Marge unitaire moyenne</span>
                <span className="value positive">{formatCurrency(averageProfitPerOrder)}</span>
                <small>Profit par commande</small>
              </div>
              <div className="profit-item">
                <span>Commandes livrées</span>
                <span className="value">{deliveredOrdersCount}</span>
                <small>Nombre total de ventes</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <>
          <div className="chart-card">
            <h3>Évolution financière mensuelle</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d6cc" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Legend 
                    wrapperStyle={{ fontFamily: "Lato", fontSize: 13, paddingTop: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#10b981", r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="depenses" 
                    name="Dépenses" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#ef4444", r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    name="Gain Net" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#8b5cf6", r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Performance comparative</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d6cc" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Legend 
                    wrapperStyle={{ fontFamily: "Lato", fontSize: 13, paddingTop: 10 }}
                  />
                  <Bar dataKey="ventes" name="Ventes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}