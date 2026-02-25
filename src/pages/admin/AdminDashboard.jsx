import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  BookOpen, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  RefreshCw,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { 
  fetchDashboardStats, 
  fetchMonthlyStats,
  fetchCommandes, 
  fetchDepenses,
  selectDashboardStats,
  selectMonthlyStats,
  selectCommandes,
  selectDepenses
} from "../../store/store";
import "../../css/AdminDashboard.css";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  
  // Use selectors instead of direct state access (better practice)
  const stats = useSelector(selectDashboardStats);
  const monthlyStats = useSelector(selectMonthlyStats);
  const commandes = useSelector(selectCommandes);
  const depenses = useSelector(selectDepenses);

  useEffect(() => {
    // Fetch all dashboard data
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchCommandes());
    dispatch(fetchDepenses());
  }, [dispatch]);

  // Calculate all commandes statistics
  const commandesStats = useMemo(() => {
    if (!commandes || commandes.length === 0) {
      return {
        total: 0,
        nouvelle: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
        pending: 0,
        completed: 0,
        totalSales: 0, // Sum of all parcel prices
        totalProfit: 0, // Sum of all profits
        revenue: 0,
        conversionRate: 0
      };
    }

    const stats = {
      total: commandes.length,
      nouvelle: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      pending: 0,
      completed: 0,
      totalSales: 0, // Sum of all parcel prices
      totalProfit: 0, // Sum of all profits
      revenue: 0,
      conversionRate: 0
    };

    commandes.forEach(commande => {
      // Get status (handle both English and French)
      const status = (commande.statut || commande.status || 'nouvelle').toLowerCase();
      
      // Count by status
      if (status === 'nouvelle' || status === 'new') stats.nouvelle++;
      else if (status === 'confirmed' || status === 'confirmée') stats.confirmed++;
      else if (status === 'shipped' || status === 'expédiée') stats.shipped++;
      else if (status === 'delivered' || status === 'livrée') stats.delivered++;
      else if (status === 'cancelled' || status === 'annulée') stats.cancelled++;
      else if (status === 'returned' || status === 'retournée') stats.returned++;

      // Count pending orders (not in final state)
      const finalStates = ['delivered', 'livrée', 'cancelled', 'annulée', 'returned', 'retournée'];
      if (!finalStates.includes(status)) {
        stats.pending++;
      }

      // Count completed orders
      if (status === 'delivered' || status === 'livrée') {
        stats.completed++;
        stats.revenue += Number(commande.total || 0);
      }

      // Calculate total sales from all commandes (parcel_price)
      // Use parcel_price if available, otherwise fall back to total
      const parcelPrice = Number(commande.parcel_price || commande.total || 0);
      stats.totalSales += parcelPrice;

      // Calculate total profit from all commandes
      const profit = Number(commande.profit || 0);
      stats.totalProfit += profit;
    });

    // Calculate conversion rate
    stats.conversionRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

    return stats;
  }, [commandes]);

  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    if (!commandes || commandes.length === 0) return [];
    
    return [...commandes]
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5);
  }, [commandes]);

  // Status labels mapping
  const statusLabels = {
    nouvelle: "Nouvelle",
    new: "Nouvelle",
    confirmed: "Confirmée",
    confirmée: "Confirmée",
    shipped: "Expédiée",
    expédiée: "Expédiée",
    delivered: "Livrée",
    livrée: "Livrée",
    cancelled: "Annulée",
    annulée: "Annulée",
    returned: "Retournée",
    retournée: "Retournée",
  };

  // Status colors mapping for CSS classes
  const statusColors = {
    nouvelle: "new",
    new: "new",
    confirmed: "confirmed",
    confirmée: "confirmed",
    shipped: "shipped",
    expédiée: "shipped",
    delivered: "delivered",
    livrée: "delivered",
    cancelled: "cancelled",
    annulée: "cancelled",
    returned: "returned",
    retournée: "returned",
  };

  // Status icons mapping
  const statusIcons = {
    nouvelle: Clock,
    new: Clock,
    confirmed: CheckCircle,
    confirmée: CheckCircle,
    shipped: Truck,
    expédiée: Truck,
    delivered: Package,
    livrée: Package,
    cancelled: XCircle,
    annulée: XCircle,
    returned: RefreshCw,
    retournée: RefreshCw,
  };

  // Colors for pie chart
  const PIE_COLORS = {
    nouvelle: '#007bff',
    confirmed: '#10b981',
    shipped: '#f59e0b',
    delivered: '#34d399',
    cancelled: '#ef4444',
    returned: '#8b5cf6'
  };

  // Pie chart data for status distribution
  const pieChartData = useMemo(() => {
    const data = [
      { name: 'Nouvelles', value: commandesStats.nouvelle, color: PIE_COLORS.nouvelle },
      { name: 'Confirmées', value: commandesStats.confirmed, color: PIE_COLORS.confirmed },
      { name: 'Expédiées', value: commandesStats.shipped, color: PIE_COLORS.shipped },
      { name: 'Livrées', value: commandesStats.delivered, color: PIE_COLORS.delivered },
      { name: 'Annulées', value: commandesStats.cancelled, color: PIE_COLORS.cancelled },
      { name: 'Retournées', value: commandesStats.returned, color: PIE_COLORS.returned }
    ].filter(item => item.value > 0);
    
    return data;
  }, [commandesStats]);

  // Main financial cards - Using calculated values from commandes
  const financialCards = [
    { 
      title: "Total des ventes", 
      value: commandesStats.totalSales, // Using calculated total from all orders
      icon: ShoppingCart,
      color: "info"
    },
    { 
      title: "Profit total", 
      value: commandesStats.totalProfit, // Using calculated profit from all orders
      icon: TrendingUp,
      color: "success"
    },
    { 
      title: "Total dépenses", 
      value: Number(stats?.total_expenses || 0), 
      icon: DollarSign,
      color: "danger"
    },
    { 
      title: "Revenu net", 
      value: commandesStats.totalProfit - Number(stats?.total_expenses || 0), // Net = Total Profit - Expenses
      icon: BookOpen,
      color: (commandesStats.totalProfit - Number(stats?.total_expenses || 0)) >= 0 ? "success" : "danger"
    },
  ];

  // All Commandes Status Cards
  const commandesStatusCards = [
    {
      title: "Total Commandes",
      value: commandesStats.total,
      icon: ShoppingCart,
      color: "primary"
    },
    {
      title: "Nouvelles",
      value: commandesStats.nouvelle,
      icon: Clock,
      color: "info"
    },
    {
      title: "Confirmées",
      value: commandesStats.confirmed,
      icon: CheckCircle,
      color: "success"
    },
    {
      title: "Expédiées",
      value: commandesStats.shipped,
      icon: Truck,
      color: "warning"
    },
    {
      title: "Livrées",
      value: commandesStats.delivered,
      icon: Package,
      color: "success"
    },
    {
      title: "Annulées",
      value: commandesStats.cancelled,
      icon: XCircle,
      color: "danger"
    },
    {
      title: "Retournées",
      value: commandesStats.returned,
      icon: RefreshCw,
      color: "purple"
    },
    {
      title: "En attente",
      value: commandesStats.pending,
      icon: Clock,
      color: "warning"
    }
  ];

  // Format month data for chart display
  const chartData = monthlyStats?.map(item => ({
    month: item.month || item.mois || `Mois ${item.month_number}`,
    ventes: Number(item.sales || item.ventes || 0),
    profit: Number(item.profit || 0),
    depenses: Number(item.expenses || item.depenses || 0)
  })) || [];

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('MAD', '').trim();
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble de votre activité</p>
        </div>
        <div className="header-stats">
          <span className="last-update">
            <Clock size={14} />
            {commandesStats.total} commandes • {formatCurrency(commandesStats.totalSales)} DH de ventes
          </span>
        </div>
      </div>

      {/* Financial Stats Cards - Now showing correct totals */}
      <div className="section-title">
        <h3>Aperçu financier</h3>
      </div>
      <div className="stats-grid">
        {financialCards.map((card) => (
          <div key={card.title} className={`stat-card ${card.color}`}>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{formatCurrency(card.value)} DH</h3>
              {card.title === "Total des ventes" && (
                <span className="stat-trend">
                  <ArrowUpRight size={12} />
                  {commandesStats.total} commandes
                </span>
              )}
              {card.title === "Profit total" && (
                <span className="stat-trend">
                  <ArrowUpRight size={12} />
                  {((commandesStats.totalProfit / commandesStats.totalSales) * 100 || 0).toFixed(1)}% marge
                </span>
              )}
            </div>
            <div className="stat-icon">
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Commandes Status Cards - All Statuses */}
      <div className="section-title" style={{ marginTop: '2rem' }}>
        <h3>Statistiques des commandes</h3>
        <p>Tous les statuts en temps réel</p>
      </div>
      <div className="stats-grid status-grid">
        {commandesStatusCards.map((card) => (
          <div key={card.title} className={`stat-card ${card.color}`}>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{card.value}</h3>
              {card.title === "Livrées" && (
                <span className="stat-trend">
                  <ArrowUpRight size={12} />
                  {formatCurrency(commandesStats.revenue)} DH
                </span>
              )}
              {card.title === "Total Commandes" && commandesStats.total > 0 && (
                <span className="stat-trend">
                  {commandesStats.conversionRate.toFixed(1)}% converties
                </span>
              )}
            </div>
            <div className="stat-icon">
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section - Bar Chart and Pie Chart */}
      <div className="charts-grid">
        {/* Monthly Evolution Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <BarChart3 size={18} />
            <h3>Évolution mensuelle</h3>
          </div>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                    tickFormatter={(value) => `${value/1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value) => [`${formatCurrency(value)} DH`, '']}
                  />
                  <Bar dataKey="ventes" name="Ventes" fill="#4a2c2a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Aucune donnée mensuelle disponible</div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <PieChartIcon size={18} />
            <h3>Répartition des statuts</h3>
          </div>
          <div className="pie-chart-container">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#6b5752', strokeWidth: 1 }}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} commandes`, '']}
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white" 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <PieChartIcon size={24} />
                <p>Aucune donnée de statut disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders with Status Circles */}
      <div className="recent-orders-section">
        <div className="section-title">
          <h3>Commandes récentes</h3>
        </div>
        <div className="recent-orders-card full-width">
          <div className="orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const status = (order.statut || order.status || 'nouvelle').toLowerCase();
                const StatusIcon = statusIcons[status] || Clock;
                
                return (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-main">
                        {/* Status Circle */}
                        <span className={`status-circle ${statusColors[status] || "new"}`}></span>
                        <div>
                          <p className="order-client">{order.nom_client || order.client_name || "Client"}</p>
                          <p className="order-details">
                            {order.code || `#${order.id}`} • {new Date(order.date || order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className="order-total">{formatCurrency(order.total || 0)} DH</p>
                    </div>
                    <div className="order-footer">
                      <StatusIcon size={14} className={`status-icon ${statusColors[status] || "new"}`} />
                      <span className={`status-badge ${statusColors[status] || "new"}`}>
                        {statusLabels[status] || "Nouvelle"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <AlertCircle size={24} />
                <p>Aucune commande récente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="summary-card" style={{ marginTop: '1.5rem' }}>
        <h3>Résumé financier</h3>
        <div className="summary-item">
          <span>Total des ventes (toutes commandes)</span>
          <span className="amount positive">{formatCurrency(commandesStats.totalSales)} DH</span>
        </div>
        <div className="summary-item">
          <span>Profit total (toutes commandes)</span>
          <span className="amount positive">{formatCurrency(commandesStats.totalProfit)} DH</span>
        </div>
        <div className="summary-item">
          <span>Dépenses totales</span>
          <span className="amount negative">{formatCurrency(stats?.total_expenses || 0)} DH</span>
        </div>
        <div className="summary-item">
          <span>Revenu des commandes livrées</span>
          <span className="amount positive">{formatCurrency(commandesStats.revenue)} DH</span>
        </div>
        <div className="summary-item">
          <span>Taux de conversion</span>
          <span className="amount success">{commandesStats.conversionRate.toFixed(1)}%</span>
        </div>
        <div className="summary-total">
          <span>Résultat net (Profit - Dépenses)</span>
          <span className={`amount ${(commandesStats.totalProfit - Number(stats?.total_expenses || 0)) >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(commandesStats.totalProfit - Number(stats?.total_expenses || 0))} DH
          </span>
        </div>
      </div>
    </div>
  );
}