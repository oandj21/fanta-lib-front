import { useEffect, useMemo, useState } from "react";
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
  BarChart3,
  CreditCard,
  PackageX,
  PackageCheck,
  MapPin,
  Filter,
  Copy
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import axios from "axios";
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

// Helper to get status color
const getStatusColor = (status) => {
  if (!status) return '#6b7280';
  
  const statusLower = status.toLowerCase();
  
  if (status === 'DELIVERED' || statusLower.includes('livré')) return '#10b981';
  if (status === 'RETURNED' || statusLower.includes('retourné')) return '#ef4444';
  if (status === 'CANCELLED' || statusLower.includes('annulé')) return '#6b7280';
  if (status === 'IN_PROGRESS' || statusLower.includes('en cours')) return '#f97316';
  if (status === 'SENT' || statusLower.includes('expédié')) return '#0891b2';
  if (status === 'REFUSE' || statusLower.includes('refusé')) return '#dc2626';
  if (status === 'NOANSWER' || statusLower.includes('pas de réponse')) return '#f59e0b';
  
  return '#6b7280';
};

// Status labels
const statusLabels = {
  'DELIVERED': 'Livré',
  'RETURNED': 'Retourné',
  'CANCELLED': 'Annulé',
  'IN_PROGRESS': 'En cours',
  'SENT': 'Expédié',
  'REFUSE': 'Refusé',
  'NOANSWER': 'Pas de réponse'
};

// Colors for pie chart
const PIE_COLORS = {
  'DELIVERED': '#10b981',
  'RETURNED': '#ef4444',
  'CANCELLED': '#6b7280',
  'IN_PROGRESS': '#f97316',
  'SENT': '#0891b2',
  'REFUSE': '#dc2626',
  'NOANSWER': '#f59e0b'
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  
  const stats = useSelector(selectDashboardStats);
  const monthlyStats = useSelector(selectMonthlyStats);
  const commandes = useSelector(selectCommandes);
  const depenses = useSelector(selectDepenses);

  const [trackingInfoMap, setTrackingInfoMap] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchCommandes());
    dispatch(fetchDepenses());
  }, [dispatch]);

  // Fetch tracking info
  useEffect(() => {
    if (commandes.length > 0) {
      const fetchAllTrackingInfo = async () => {
        const token = localStorage.getItem("token");
        
        for (const order of commandes) {
          if (order.parcel_code && !trackingInfoMap[order.parcel_code]) {
            try {
              const response = await axios.get(
                `https://fanta-lib-back-production.up.railway.app/api/welivexpress/trackparcel`,
                {
                  params: { parcel_code: order.parcel_code },
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              if (response.data.success && response.data.data) {
                setTrackingInfoMap(prev => ({
                  ...prev,
                  [order.parcel_code]: response.data.data
                }));
              }
            } catch (err) {
              console.error(`Error fetching tracking for ${order.parcel_code}:`, err);
            }
          }
        }
      };

      fetchAllTrackingInfo();
    }
  }, [commandes]);

  // Get tracking status
  const getTrackingStatus = (parcelCode) => {
    if (!parcelCode) return null;
    const info = trackingInfoMap[parcelCode];
    if (!info || !info.parcel) return null;
    return {
      deliveryStatus: info.parcel.delivery_status,
      secondaryStatus: info.parcel.status_second,
      paymentStatus: info.parcel.payment_status
    };
  };

  // Calculate commandes statistics
  const commandesStats = useMemo(() => {
    if (!commandes || commandes.length === 0) {
      return {
        total: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        in_progress: 0,
        sent: 0,
        refuse: 0,
        noanswer: 0,
        pending: 0,
        totalSales: 0,
        totalProfit: 0,
        revenue: 0,
        conversionRate: 0
      };
    }

    const stats = {
      total: commandes.length,
      delivered: 0,
      returned: 0,
      cancelled: 0,
      in_progress: 0,
      sent: 0,
      refuse: 0,
      noanswer: 0,
      pending: 0,
      totalSales: 0,
      totalProfit: 0,
      revenue: 0,
      conversionRate: 0
    };

    commandes.forEach(commande => {
      const tracking = getTrackingStatus(commande.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || commande.statut || '';
      const secondaryStatus = tracking?.secondaryStatus || commande.statut_second || '';
      
      const statusUpper = deliveryStatus.toUpperCase();
      const secondaryUpper = secondaryStatus.toUpperCase();
      
      // Count by status
      if (statusUpper === 'DELIVERED' || statusUpper.includes('LIVR')) stats.delivered++;
      else if (statusUpper === 'RETURNED' || statusUpper.includes('RETOUR')) stats.returned++;
      else if (statusUpper === 'CANCELLED' || statusUpper.includes('ANNUL')) stats.cancelled++;
      else if (statusUpper === 'IN_PROGRESS' || statusUpper.includes('COURS')) stats.in_progress++;
      else if (statusUpper === 'SENT' || statusUpper.includes('EXPÉDI')) stats.sent++;
      
      // Count secondary statuses
      if (secondaryUpper === 'REFUSE' || secondaryUpper.includes('REFUS')) stats.refuse++;
      else if (secondaryUpper === 'NOANSWER' || secondaryUpper.includes('RÉPONSE')) stats.noanswer++;

      // Count pending orders
      const finalStates = ['DELIVERED', 'LIVR', 'RETURNED', 'RETOUR', 'CANCELLED', 'ANNUL'];
      const isFinal = finalStates.some(state => statusUpper.includes(state));
      if (!isFinal) {
        stats.pending++;
      }

      // Count completed orders
      if (statusUpper === 'DELIVERED' || statusUpper.includes('LIVR')) {
        stats.completed = (stats.completed || 0) + 1;
        stats.revenue += Number(commande.parcel_price || commande.total || 0);
      }

      // Calculate totals from ALL orders (not just delivered)
      stats.totalSales += Number(commande.parcel_price || commande.total || 0);
      stats.totalProfit += Number(commande.profit || 0);
    });

    stats.conversionRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

    return stats;
  }, [commandes, trackingInfoMap]);

  // CRITICAL FIX: Calculate monthly data DIRECTLY from commandes and depenses
  const monthlyData = useMemo(() => {
    console.log("Calculating monthly data from:", {
      commandesCount: commandes?.length || 0,
      depensesCount: depenses?.length || 0
    });

    if (!commandes || commandes.length === 0) {
      return [];
    }

    // Get last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth() + 1,
        key: `${date.getFullYear()}-${date.getMonth() + 1}`
      });
    }

    // Calculate totals for each month
    return months.map(monthData => {
      // Filter commandes for this month
      const monthCommandes = commandes.filter(commande => {
        if (!commande.date && !commande.created_at) return false;
        const commandeDate = new Date(commande.date || commande.created_at);
        return commandeDate.getMonth() + 1 === monthData.monthNum && 
               commandeDate.getFullYear() === monthData.year;
      });

      // Filter depenses for this month
      const monthDepenses = depenses.filter(depense => {
        if (!depense.date && !depense.created_at) return false;
        const depenseDate = new Date(depense.date || depense.created_at);
        return depenseDate.getMonth() + 1 === monthData.monthNum && 
               depenseDate.getFullYear() === monthData.year;
      });

      // Calculate totals
      const totalDepenses = monthDepenses.reduce((sum, d) => {
        return sum + (Number(d.montant) || 0);
      }, 0);

      // Calculate profit from ALL commandes this month (not just delivered)
      const totalProfit = monthCommandes.reduce((sum, c) => {
        return sum + (Number(c.profit) || 0);
      }, 0);

      // Calculate sales from ALL commandes this month
      const totalVentes = monthCommandes.reduce((sum, c) => {
        return sum + (Number(c.parcel_price || c.total || 0));
      }, 0);

      // Log each month for debugging
      console.log(`Month ${monthData.month} ${monthData.year}:`, {
        commandesCount: monthCommandes.length,
        depensesCount: monthDepenses.length,
        totalDepenses,
        totalProfit,
        totalVentes,
        sampleCommande: monthCommandes[0] ? {
          profit: monthCommandes[0].profit,
          parcel_price: monthCommandes[0].parcel_price,
          statut: monthCommandes[0].statut
        } : null
      });

      return {
        month: monthData.month,
        depenses: totalDepenses,      // First bar - Total dépenses
        profit: totalProfit,           // Second bar - Profit total
        ventes: totalVentes            // Third bar - Total des ventes
      };
    });
  }, [commandes, depenses]);

  // Financial cards
  const financialCards = [
    { 
      title: "Total dépenses", 
      value: Number(stats?.total_expenses || 0), 
      icon: DollarSign,
      color: "danger",
      trend: `${depenses.length} dépenses`
    },
    { 
      title: "Profit total", 
      value: commandesStats.totalProfit,
      icon: TrendingUp,
      color: "success",
      trend: `${((commandesStats.totalProfit / (commandesStats.totalSales || 1)) * 100).toFixed(1)}% marge`
    },
    { 
      title: "Total des ventes", 
      value: commandesStats.totalSales,
      icon: ShoppingCart,
      color: "info",
      trend: `${commandesStats.total} commandes`
    },
    { 
      title: "Revenu net", 
      value: commandesStats.totalProfit - Number(stats?.total_expenses || 0),
      icon: BookOpen,
      color: (commandesStats.totalProfit - Number(stats?.total_expenses || 0)) >= 0 ? "success" : "danger"
    },
  ];

  // Status cards
  const commandesStatusCards = [
    { title: "Total Commandes", value: commandesStats.total, icon: ShoppingCart, color: "primary" },
    { title: "Livrés", value: commandesStats.delivered, icon: PackageCheck, color: "success" },
    { title: "En cours", value: commandesStats.in_progress + commandesStats.sent, icon: RefreshCw, color: "warning" },
    { title: "Retournés", value: commandesStats.returned, icon: PackageX, color: "danger" },
    { title: "Annulés", value: commandesStats.cancelled, icon: XCircle, color: "secondary" },
    { title: "Refusés", value: commandesStats.refuse, icon: XCircle, color: "danger" },
    { title: "Pas de réponse", value: commandesStats.noanswer, icon: Clock, color: "warning" },
    { title: "En attente", value: commandesStats.pending, icon: Clock, color: "warning" }
  ].filter(card => card.value > 0);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const statusCounts = {};
    
    commandes.forEach(commande => {
      const tracking = getTrackingStatus(commande.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || commande.statut;
      const secondaryStatus = tracking?.secondaryStatus || commande.statut_second;
      
      if (deliveryStatus) {
        statusCounts[deliveryStatus] = (statusCounts[deliveryStatus] || 0) + 1;
      }
      if (secondaryStatus && secondaryStatus !== '') {
        statusCounts[secondaryStatus] = (statusCounts[secondaryStatus] || 0) + 1;
      }
    });
    
    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: PIE_COLORS[name] || getStatusColor(name)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [commandes, trackingInfoMap]);

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
        <div className="header-left">
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble de votre activité</p>
        </div>
        <div className="header-right">
          <span className="last-update">
            <Clock size={14} />
            {commandesStats.total} commandes • {formatCurrency(commandesStats.totalSales)} DH de ventes
          </span>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="section-title">
        <h3>Aperçu financier</h3>
      </div>
      <div className="stats-grid">
        {financialCards.map((card) => (
          <div key={card.title} className={`stat-card ${card.color}`}>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{formatCurrency(card.value)} DH</h3>
              {card.trend && (
                <span className="stat-trend">
                  <ArrowUpRight size={12} />
                  {card.trend}
                </span>
              )}
            </div>
            <div className="stat-icon">
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Status Cards */}
      <div className="section-title" style={{ marginTop: '2rem' }}>
        <h3>Statistiques des commandes</h3>
      </div>
      <div className="stats-grid status-grid">
        {commandesStatusCards.map((card) => (
          <div key={card.title} className={`stat-card ${card.color}`}>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{card.value}</h3>
            </div>
            <div className="stat-icon">
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Monthly Evolution Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <BarChart3 size={18} />
            <h3>Évolution mensuelle</h3>
          </div>
          <div className="chart-container">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                      background: "white"
                    }}
                    formatter={(value, name) => {
                      const labels = {
                        depenses: 'Dépenses',
                        profit: 'Profit',
                        ventes: 'Ventes'
                      };
                      return [`${formatCurrency(value)} DH`, labels[name] || name];
                    }}
                  />
                  <Bar 
                    dataKey="depenses" 
                    name="Dépenses" 
                    fill="#ef4444" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <Bar 
                    dataKey="profit" 
                    name="Profit" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <Bar 
                    dataKey="ventes" 
                    name="Ventes" 
                    fill="#5c0202" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <AlertCircle size={24} />
                <p>Aucune donnée mensuelle disponible</p>
              </div>
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
                    label={({ name, percent }) => {
                      const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                      return `${displayName} ${(percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={{ stroke: '#6b5752', strokeWidth: 1 }}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} commande${value > 1 ? 's' : ''}`, '']}
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