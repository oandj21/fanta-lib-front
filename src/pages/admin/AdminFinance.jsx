import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  BookOpen,
  Wallet,
  ArrowUpCircle,
  Edit3,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Area, AreaChart
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
  const [timeRange, setTimeRange] = useState('6months'); // '3months', '6months', '12months', 'all'

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
  // 📊 DYNAMIC FINANCIAL CALCULATIONS
  // ==============================================

  // Capital from finance table
  const capital = currentFinance?.capital || 0;

  // 1. Calculate total stock value (prix_achat from livres)
  const totalStockValue = useMemo(() => {
    return livresList.reduce((sum, livre) => {
      return sum + (Number(livre.prix_achat) || 0);
    }, 0);
  }, [livresList]);

  // 2. Calculate total profit from ALL orders (profit from commandes)
  const totalProfit = useMemo(() => {
    return commandesList.reduce((sum, commande) => {
      return sum + (Number(commande.profit) || 0);
    }, 0);
  }, [commandesList]);

  // 3. Calculate total expenses (montant from depenses)
  const totalExpenses = useMemo(() => {
    return depensesList.reduce((sum, depense) => {
      return sum + (Number(depense.montant) || 0);
    }, 0);
  }, [depensesList]);

  // 4. Calculate revenue from ALL orders (total from commandes)
  const revenue = useMemo(() => {
    return commandesList.reduce((sum, commande) => {
      return sum + (Number(commande.total) || 0);
    }, 0);
  }, [commandesList]);

  // 5. Calculate net gain (profit - expenses)
  const netGain = totalProfit - totalExpenses;

  // 6. Calculate ROI (Return on Investment)
  const roi = capital > 0 ? ((netGain / capital) * 100).toFixed(1) : 0;

  // 7. Calculate profit margin
  const profitMargin = revenue > 0 ? ((totalProfit / revenue) * 100).toFixed(1) : 0;

  // 8. Calculate total number of orders
  const totalOrdersCount = commandesList.length;

  // 9. Calculate average order value
  const averageOrderValue = totalOrdersCount > 0 ? revenue / totalOrdersCount : 0;

  // 10. Calculate average profit per order
  const averageProfitPerOrder = totalOrdersCount > 0 ? totalProfit / totalOrdersCount : 0;

  // 11. Calculate expense ratio
  const expenseRatio = totalProfit > 0 ? ((totalExpenses / totalProfit) * 100).toFixed(1) : 0;

  // 12. Calculate capital turnover
  const capitalTurnover = capital > 0 ? (revenue / capital).toFixed(2) : 0;

  // ==============================================
  // 📊 DYNAMIC CHART DATA
  // ==============================================

  // Filter monthly data based on time range
  const filteredMonthlyData = useMemo(() => {
    if (!monthlyStats || monthlyStats.length === 0) return [];
    
    let data = [...monthlyStats];
    
    if (timeRange === '3months') {
      data = data.slice(-3);
    } else if (timeRange === '6months') {
      data = data.slice(-6);
    } else if (timeRange === '12months') {
      data = data.slice(-12);
    }
    // 'all' returns all data
    
    return data.map(item => ({
      month: item.month || item.month_name || '',
      ventes: Number(item.ventes || item.sales || 0),
      profit: Number(item.profit || 0),
      depenses: Number(item.depenses || item.expenses || 0),
      net: (Number(item.profit || 0) - Number(item.depenses || item.expenses || 0))
    }));
  }, [monthlyStats, timeRange]);

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const categories = {};
    
    // Group expenses by category
    depensesList.forEach(depense => {
      const category = depense.categorie || 'Autres';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += Number(depense.montant) || 0;
    });
    
    // Convert to array for chart
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [depensesList]);

  // Monthly profit trend
  const profitTrendData = useMemo(() => {
    return filteredMonthlyData.map(item => ({
      month: item.month,
      profit: item.profit,
      cumulatedProfit: filteredMonthlyData
        .slice(0, filteredMonthlyData.indexOf(item) + 1)
        .reduce((sum, d) => sum + d.profit, 0)
    }));
  }, [filteredMonthlyData]);

  // Top performing months
  const topMonths = useMemo(() => {
    return [...filteredMonthlyData]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(item => ({
        month: item.month,
        profit: item.profit
      }));
  }, [filteredMonthlyData]);

  // Status distribution for orders
  const orderStatusData = useMemo(() => {
    const statuses = {};
    
    commandesList.forEach(commande => {
      const status = commande.statut || 'Inconnu';
      if (!statuses[status]) {
        statuses[status] = 0;
      }
      statuses[status] += 1;
    });
    
    return Object.entries(statuses).map(([name, count]) => ({
      name,
      count
    }));
  }, [commandesList]);

  // Monthly performance comparison
  const comparisonData = useMemo(() => {
    return filteredMonthlyData.map(item => ({
      month: item.month,
      ratio: item.depenses > 0 ? (item.profit / item.depenses).toFixed(2) : item.profit,
      efficiency: item.ventes > 0 ? ((item.profit / item.ventes) * 100).toFixed(1) : 0
    }));
  }, [filteredMonthlyData]);

  // Colors for charts
  const COLORS = ['#4a2c2a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

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
      description: "Bénéfice des ventes"
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
      description: "Total des ventes (toutes commandes)"
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
          <div className="time-range-selector">
            <button 
              className={timeRange === '3months' ? 'active' : ''}
              onClick={() => setTimeRange('3months')}
            >
              3 mois
            </button>
            <button 
              className={timeRange === '6months' ? 'active' : ''}
              onClick={() => setTimeRange('6months')}
            >
              6 mois
            </button>
            <button 
              className={timeRange === '12months' ? 'active' : ''}
              onClick={() => setTimeRange('12months')}
            >
              12 mois
            </button>
            <button 
              className={timeRange === 'all' ? 'active' : ''}
              onClick={() => setTimeRange('all')}
            >
              Tous
            </button>
          </div>
          <button 
            className="update-capital-btn"
            onClick={() => setShowCapitalModal(true)}
          >
            <Edit3 size={18} />
            <span>Mettre à jour le capital</span>
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
        <button 
          className={activeTab === 'analysis' ? 'active' : ''} 
          onClick={() => setActiveTab('analysis')}
        >
          Analyse détaillée
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
                    style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                  ></div>
                </div>
                <span className="ratio-value">{expenseRatio}%</span>
              </div>
              <div className="ratio-item">
                <span className="ratio-label">Rotation du capital</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill info" 
                    style={{ width: `${Math.min(capitalTurnover * 10, 100)}%` }}
                  ></div>
                </div>
                <span className="ratio-value">{capitalTurnover}x</span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Répartition des gains</h3>
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Gain Net', value: Math.max(netGain, 0) },
                        { name: 'Dépenses', value: totalExpenses }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {[
                        { name: 'Gain Net', color: '#10b981' },
                        { name: 'Dépenses', color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>Répartition des dépenses par catégorie</h3>
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
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
              <div className="profit-item">
                <span>Ratio de rentabilité</span>
                <span className="value">{profitMargin}%</span>
                <small>Marge bénéficiaire</small>
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
                <small>Par commande (toutes commandes)</small>
              </div>
              <div className="profit-item">
                <span>Marge unitaire moyenne</span>
                <span className="value positive">{formatCurrency(averageProfitPerOrder)}</span>
                <small>Profit par commande</small>
              </div>
              <div className="profit-item">
                <span>Nombre total de commandes</span>
                <span className="value">{totalOrdersCount}</span>
                <small>Toutes commandes confondues</small>
              </div>
              <div className="profit-item">
                <span>Valeur moyenne du stock</span>
                <span className="value">{formatCurrency(totalStockValue / (livresList.length || 1))}</span>
                <small>Par livre</small>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Top 5 mois les plus rentables</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topMonths} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis type="category" dataKey="month" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                <LineChart data={filteredMonthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    tickFormatter={(value) => formatCurrency(value)}
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
                    dataKey="ventes" 
                    name="Ventes" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#f59e0b", r: 4 }} 
                    activeDot={{ r: 6 }}
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
                <BarChart data={filteredMonthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    tickFormatter={(value) => formatCurrency(value)}
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

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Profit cumulé</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={profitTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area 
                      type="monotone" 
                      dataKey="cumulatedProfit" 
                      name="Profit Cumulé" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>Statut des commandes</h3>
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analysis' && (
        <div className="analysis-section">
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Ratio Profit/Dépenses</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="ratio" 
                      name="Ratio Profit/Dépenses" 
                      stroke="#10b981" 
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="efficiency" 
                      name="Efficacité (%)" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>Analyse de performance</h3>
              <div className="stats-mini-grid">
                <div className="stat-mini-item">
                  <span className="label">Moyenne mensuelle des ventes</span>
                  <span className="value">{formatCurrency(revenue / (filteredMonthlyData.length || 1))}</span>
                </div>
                <div className="stat-mini-item">
                  <span className="label">Moyenne mensuelle des profits</span>
                  <span className="value positive">{formatCurrency(totalProfit / (filteredMonthlyData.length || 1))}</span>
                </div>
                <div className="stat-mini-item">
                  <span className="label">Moyenne mensuelle des dépenses</span>
                  <span className="value negative">{formatCurrency(totalExpenses / (filteredMonthlyData.length || 1))}</span>
                </div>
                <div className="stat-mini-item">
                  <span className="label">Meilleur mois (profit)</span>
                  <span className="value positive">
                    {topMonths[0]?.month} {topMonths[0] ? formatCurrency(topMonths[0].profit) : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}