import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  TrendingUp, 
  ShoppingCart, 
  Receipt, 
  DollarSign, 
  BookOpen,
  Wallet,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from "recharts";
import { 
  fetchDashboardStats, 
  fetchMonthlyStats,
  fetchFinances,
  fetchBooksTotalValue
} from "../../store/store";
import "../../css/AdminFinance.css";

export default function AdminFinance() {
  const dispatch = useDispatch();
  const { stats = {}, monthlyStats = [] } = useSelector((state) => state.dashboard);
  const { currentFinance, totalBooksValue } = useSelector((state) => state.finances);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchFinances());
    dispatch(fetchBooksTotalValue());
  }, [dispatch]);

  // Get capital from finance (if multiple records, get the latest)
  const capital = currentFinance?.capital || 0;

  // Calculate total profit from books
  const totalProfitBooks = Number(stats.total_profit || 0);
  
  // Calculate total expenses
  const totalDepenses = Number(stats.total_expenses || 0);
  
  // Calculate revenue (total sales)
  const revenue = Number(stats.total_sales || 0);
  
  // Calculate net income (profit - expenses)
  const netIncome = totalProfitBooks - totalDepenses;
  
  // Calculate ROI (Return on Investment)
  const roi = capital > 0 ? ((netIncome / capital) * 100).toFixed(1) : 0;
  
  // Calculate profit margin
  const profitMargin = revenue > 0 ? ((totalProfitBooks / revenue) * 100).toFixed(1) : 0;

  const mainCards = [
    { 
      label: "Capital Initial", 
      value: capital, 
      icon: Wallet,
      color: "primary",
      description: "Fonds de départ"
    },
    { 
      label: "Valeur Stock Livres", 
      value: totalBooksValue, 
      icon: BookOpen,
      color: "info",
      description: "Prix d'achat total"
    },
    { 
      label: "Revenu Total", 
      value: revenue, 
      icon: DollarSign,
      color: "success",
      description: "Chiffre d'affaires"
    },
    { 
      label: "Profit Total", 
      value: totalProfitBooks, 
      icon: TrendingUp,
      color: "success",
      description: "Marge brute"
    },
  ];

  const secondaryCards = [
    { 
      label: "Dépenses Totales", 
      value: totalDepenses, 
      icon: Receipt,
      color: "danger",
      description: "Coûts opérationnels"
    },
    { 
      label: "Revenu Net", 
      value: netIncome, 
      icon: PieChart,
      color: netIncome >= 0 ? "success" : "danger",
      description: netIncome >= 0 ? "Bénéfice" : "Perte"
    },
    { 
      label: "Marge Bénéficiaire", 
      value: profitMargin,
      isPercentage: true,
      icon: ArrowUpCircle,
      color: "warning",
      description: "Profit / Revenu"
    },
    { 
      label: "ROI", 
      value: roi,
      isPercentage: true,
      icon: RefreshCw,
      color: "purple",
      description: "Retour sur investissement"
    },
  ];

  // Format chart data
  const chartData = monthlyStats.map(item => ({
    month: item.month,
    ventes: Number(item.ventes || item.sales || 0),
    profit: Number(item.profit || 0),
    depenses: Number(item.depenses || item.expenses || 0),
    net: Number(item.profit || 0) - Number(item.depenses || item.expenses || 0)
  }));

  // Pie chart data for expense breakdown
  const expenseBreakdown = [
    { name: 'Profit Net', value: Math.max(netIncome, 0), color: '#10b981' },
    { name: 'Dépenses', value: totalDepenses, color: '#ef4444' },
  ];

  // Colors for charts
  const COLORS = ['#4a2c2a', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="admin-finance">
      <div className="finance-header">
        <div className="header-content">
          <h2>Finance & Analytics</h2>
          <p>Analyse financière détaillée de votre activité</p>
        </div>
        <div className="header-actions">
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid main-grid">
        {mainCards.map(({ label, value, icon: Icon, color, description }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{label}</p>
              <h3 className="stat-value">{formatCurrency(value)}</h3>
              <p className="stat-description">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Grid */}
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
                <span className="amount">{formatCurrency(totalBooksValue)}</span>
              </div>
              <div className="summary-item">
                <span>Chiffre d'affaires</span>
                <span className="amount">{formatCurrency(revenue)}</span>
              </div>
              <div className="summary-item">
                <span>Profit brut</span>
                <span className="amount positive">{formatCurrency(totalProfitBooks)}</span>
              </div>
              <div className="summary-item">
                <span>Dépenses totales</span>
                <span className="amount negative">-{formatCurrency(totalDepenses)}</span>
              </div>
              <div className="summary-total">
                <span>Résultat net</span>
                <span className={`amount ${netIncome >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(netIncome)}
                </span>
              </div>
            </div>

            <div className="ratios-card">
              <h3>Indicateurs clés</h3>
              <div className="ratio-item">
                <span className="ratio-label">Marge nette</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill" 
                    style={{ width: `${profitMargin}%` }}
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
                <span className="ratio-label">Ratio dépenses/ventes</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill danger" 
                    style={{ 
                      width: `${revenue > 0 ? (totalDepenses / revenue * 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="ratio-value">
                  {revenue > 0 ? (totalDepenses / revenue * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="ratio-item">
                <span className="ratio-label">Rotation du capital</span>
                <div className="ratio-bar">
                  <div 
                    className="ratio-fill info" 
                    style={{ 
                      width: `${capital > 0 ? Math.min((revenue / capital) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="ratio-value">
                  {capital > 0 ? (revenue / capital).toFixed(2) : 0}x
                </span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Répartition des revenus</h3>
            <div className="pie-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
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
                <span className="value">{formatCurrency(totalDepenses)}</span>
                <small>Dépenses totales à couvrir</small>
              </div>
              <div className="profit-item">
                <span>Point mort (jours)</span>
                <span className="value">
                  {revenue > 0 ? Math.ceil((totalDepenses / revenue) * 30) : 0} jours
                </span>
                <small>Temps pour couvrir les dépenses</small>
              </div>
              <div className="profit-item highlight">
                <span>Rentabilité nette</span>
                <span className={`value ${netIncome >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(netIncome)}
                </span>
                <small>Profit après dépenses</small>
              </div>
            </div>

            <div className="profit-card">
              <h4>Performance commerciale</h4>
              <div className="profit-item">
                <span>Ticket moyen</span>
                <span className="value">
                  {stats.total_orders > 0 ? formatCurrency(revenue / stats.total_orders) : formatCurrency(0)}
                </span>
                <small>Par commande</small>
              </div>
              <div className="profit-item">
                <span>Marge unitaire moyenne</span>
                <span className="value positive">
                  {stats.total_orders > 0 ? formatCurrency(totalProfitBooks / stats.total_orders) : formatCurrency(0)}
                </span>
                <small>Profit par commande</small>
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
                    dataKey="ventes" 
                    name="Ventes" 
                    stroke="#4a2c2a" 
                    strokeWidth={2.5} 
                    dot={{ fill: "#4a2c2a", r: 4 }} 
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
                    name="Net" 
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