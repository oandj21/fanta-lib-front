import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  PieChart,
  BarChart3,
  CreditCard,
  PackageX,
  PackageCheck,
  MapPin,
  User,
  Layers,
  FileText,
  Calendar,
  Copy,
  Eye,
  Info,
  Filter,
  Bell,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, LineChart, Line, PieChart as RePieChart, Pie, Cell } from "recharts";
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
import NotificationCenter from "../../components/NotificationCenter";
import DownloadMenu from "../../components/DownloadMenu";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "../../css/AdminDashboard.css";

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

// Status labels for display
const statusLabels = {
  'NEW_PARCEL': 'Nouveau',
  'PARCEL_CONFIRMED': 'Confirmé',
  'PICKED_UP': 'Ramassé',
  'DISTRIBUTION': 'Distribution',
  'IN_PROGRESS': 'En cours',
  'SENT': 'Expédié',
  'DELIVERED': 'Livré',
  'RETURNED': 'Retourné',
  'CANCELLED': 'Annulé',
  'CANCELED': 'Annulé',
  'WAITING_PICKUP': 'En attente',
  'RECEIVED': 'Reçu',
  'REFUSE': 'Refusé',
  'NOANSWER': 'Pas de réponse',
  'UNREACHABLE': 'Injoignable',
  'HORS_ZONE': 'Hors zone',
  'POSTPONED': 'Reporté',
  'PROGRAMMER': 'Programmé',
  'DEUX': '2ème tentative',
  'TROIS': '3ème tentative',
  'ENVG': 'En voyage',
  'RETURN_BY_AMANA': 'Retour Amana',
  'SENT_BY_AMANA': 'Envoyé Amana'
};

// Status icons mapping
const statusIcons = {
  'NEW_PARCEL': Clock,
  'PARCEL_CONFIRMED': CheckCircle,
  'PICKED_UP': Package,
  'DISTRIBUTION': Truck,
  'IN_PROGRESS': RefreshCw,
  'SENT': Truck,
  'DELIVERED': PackageCheck,
  'RETURNED': PackageX,
  'CANCELLED': XCircle,
  'CANCELED': XCircle,
  'WAITING_PICKUP': Clock,
  'RECEIVED': PackageCheck,
  'REFUSE': XCircle,
  'NOANSWER': Clock,
  'UNREACHABLE': AlertCircle,
  'HORS_ZONE': MapPin,
  'POSTPONED': Clock,
  'PROGRAMMER': Calendar,
  'DEUX': RefreshCw,
  'TROIS': RefreshCw,
  'ENVG': Truck,
  'RETURN_BY_AMANA': PackageX,
  'SENT_BY_AMANA': Package
};

// Colors for pie chart
const PIE_COLORS = {
  'NEW_PARCEL': '#3b82f6',
  'PARCEL_CONFIRMED': '#007bff',
  'PICKED_UP': '#8b5cf6',
  'DISTRIBUTION': '#f59e0b',
  'IN_PROGRESS': '#f97316',
  'SENT': '#0891b2',
  'DELIVERED': '#10b981',
  'RETURNED': '#ef4444',
  'CANCELLED': '#6b7280',
  'WAITING_PICKUP': '#f59e0b',
  'RECEIVED': '#10b981',
  'REFUSE': '#dc2626',
  'NOANSWER': '#f59e0b',
  'UNREACHABLE': '#d97706',
  'HORS_ZONE': '#7c3aed',
  'POSTPONED': '#8b5cf6',
  'PROGRAMMER': '#2563eb',
  'DEUX': '#f97316',
  'TROIS': '#ea580c',
  'ENVG': '#0891b2',
  'RETURN_BY_AMANA': '#b91c1c',
  'SENT_BY_AMANA': '#1e40af'
};

// Helper to check if a status is "in progress"
const isStatusInProgress = (status) => {
  if (!status) return false;
  
  const statusLower = status.toLowerCase();
  
  const inProgressKeywords = [
    'en cours', 'distribution', 'ramassé', 'expédié', 'attente',
    'nouveau', 'confirmé', 'programmé', 'reporté', 'voyage',
    'in_progress', 'picked_up', 'sent', 'waiting', 'new_parcel',
    'parcel_confirmed', 'programmer', 'postponed', 'envg',
    'deux', 'trois', '2ème', '3ème', 'refusé', 'noanswer',
    'pas de réponse', 'injoignable', 'hors zone',
    'PICKED_UP', 'DISTRIBUTION', 'IN_PROGRESS', 'SENT', 
    'WAITING_PICKUP', 'NEW_PARCEL', 'PARCEL_CONFIRMED', 
    'PROGRAMMER', 'POSTPONED', 'ENVG', 'DEUX', 'TROIS', 
    'REFUSE', 'NOANSWER', 'UNREACHABLE', 'HORS_ZONE'
  ];
  
  const finalKeywords = [
    'livré', 'delivered', 'retourné', 'returned', 'annulé', 'cancelled',
    'DELIVERED', 'RETURNED', 'CANCELLED', 'CANCELED', 'RETURN_BY_AMANA', 'SENT_BY_AMANA'
  ];
  
  const isInProgress = inProgressKeywords.some(keyword => 
    statusLower.includes(keyword.toLowerCase())
  );
  
  const isFinal = finalKeywords.some(keyword => 
    statusLower.includes(keyword.toLowerCase())
  );
  
  return isInProgress && !isFinal;
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const stats = useSelector(selectDashboardStats);
  const monthlyStats = useSelector(selectMonthlyStats);
  const commandes = useSelector(selectCommandes);
  const depenses = useSelector(selectDepenses);

  // Date selection state - Added day selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(null); // null means "All days", otherwise specific day
  
  const [trackingInfoMap, setTrackingInfoMap] = useState({});
  const [loadingTracking, setLoadingTracking] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [notifications, setNotifications] = useState([]);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState(new Set());
  
  const initialProcessingDone = useRef(false);

  // Generate available years (last 5 years to next year)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Month names
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Get number of days in selected month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Generate days array for selected month
  const availableDays = useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    const daysCount = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }
    return days;
  }, [selectedYear, selectedMonth]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDay(null); // Reset day selection when month changes
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDay(null); // Reset day selection when month changes
  };

  // Filter data by selected month/year/day
  const filteredCommandes = useMemo(() => {
    if (!commandes || commandes.length === 0) return [];
    
    return commandes.filter(commande => {
      const commandeDate = new Date(commande.date || commande.created_at);
      const commandeYear = commandeDate.getFullYear();
      const commandeMonth = commandeDate.getMonth() + 1;
      
      // First filter by year and month
      if (commandeYear !== selectedYear || commandeMonth !== selectedMonth) {
        return false;
      }
      
      // Then filter by day if a specific day is selected
      if (selectedDay !== null) {
        const commandeDay = commandeDate.getDate();
        return commandeDay === selectedDay;
      }
      
      return true;
    });
  }, [commandes, selectedMonth, selectedYear, selectedDay]);

  const filteredDepenses = useMemo(() => {
    if (!depenses || depenses.length === 0) return [];
    
    return depenses.filter(depense => {
      const depenseDate = new Date(depense.date || depense.created_at);
      const depenseYear = depenseDate.getFullYear();
      const depenseMonth = depenseDate.getMonth() + 1;
      
      // First filter by year and month
      if (depenseYear !== selectedYear || depenseMonth !== selectedMonth) {
        return false;
      }
      
      // Then filter by day if a specific day is selected
      if (selectedDay !== null) {
        const depenseDay = depenseDate.getDate();
        return depenseDay === selectedDay;
      }
      
      return true;
    });
  }, [depenses, selectedMonth, selectedYear, selectedDay]);

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('dashboard_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
    
    const savedNotifiedIds = localStorage.getItem('notified_order_ids');
    if (savedNotifiedIds) {
      try {
        setNotifiedOrderIds(new Set(JSON.parse(savedNotifiedIds)));
      } catch (e) {
        console.error('Error loading notified IDs:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('notified_order_ids', JSON.stringify(Array.from(notifiedOrderIds)));
  }, [notifiedOrderIds]);

  // Notification logic for filtered commandes
  useEffect(() => {
    if (filteredCommandes && filteredCommandes.length > 0 && !initialProcessingDone.current) {
      
      const existingNotificationOrderIds = new Set(
        notifications
          .filter(n => n.type === 'commande')
          .map(n => n.orderId)
      );
      
      const allNotifiedIds = new Set([...Array.from(notifiedOrderIds), ...Array.from(existingNotificationOrderIds)]);
      
      const inProgressOrders = filteredCommandes.filter(order => {
        const status = order.statut || order.status || '';
        return isStatusInProgress(status) && !allNotifiedIds.has(order.id);
      });
      
      if (inProgressOrders.length > 0) {
        console.log(`Found ${inProgressOrders.length} new in-progress orders to notify`);
        
        const newNotifications = inProgressOrders.map(order => {
          const status = order.statut || order.status || '';
          
          return {
            id: Date.now() + Math.random() + order.id,
            type: 'commande',
            action: 'status_change',
            message: `🔄 Commande en cours`,
            details: `${order.parcel_receiver || 'Client'} • ${statusLabels[status] || status}`,
            timestamp: new Date().toISOString(),
            read: false,
            user: 'Système',
            status: status,
            orderId: order.id,
            parcelCode: order.parcel_code,
            clientName: order.parcel_receiver,
            clientPhone: order.parcel_phone,
            city: order.parcel_city,
            address: order.parcel_address,
            parcelPrice: order.parcel_price,
            quantity: order.parcel_prd_qty
          };
        });

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
        
        const newNotifiedIds = new Set([
          ...Array.from(notifiedOrderIds),
          ...inProgressOrders.map(o => o.id)
        ]);
        setNotifiedOrderIds(newNotifiedIds);
      }
      
      initialProcessingDone.current = true;
    }
  }, [filteredCommandes]);

  // Fetch all data
  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchCommandes());
    dispatch(fetchDepenses());
  }, [dispatch]);

  // Fetch tracking info
  useEffect(() => {
    if (filteredCommandes.length > 0) {
      const fetchAllTrackingInfo = async () => {
        const token = localStorage.getItem("token");
        
        for (const order of filteredCommandes) {
          if (order.parcel_code && !trackingInfoMap[order.parcel_code]) {
            setLoadingTracking(prev => ({ ...prev, [order.parcel_code]: true }));
            
            try {
              const response = await axios.get(
                `http://127.0.0.1:8000/api/welivexpress/trackparcel`,
                {
                  params: { parcel_code: order.parcel_code },
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                }
              );

              if (response.data.success && response.data.data) {
                const trackingData = response.data.data;
                setTrackingInfoMap(prev => ({
                  ...prev,
                  [order.parcel_code]: trackingData
                }));
              }
            } catch (err) {
              console.error(`Error fetching tracking for ${order.parcel_code}:`, err);
            } finally {
              setLoadingTracking(prev => ({ ...prev, [order.parcel_code]: false }));
            }
          }
        }
      };

      fetchAllTrackingInfo();
    }
  }, [filteredCommandes]);

  const getTrackingStatus = (parcelCode) => {
    if (!parcelCode) return null;
    const info = trackingInfoMap[parcelCode];
    if (!info || !info.parcel) return null;
    return {
      deliveryStatus: info.parcel.delivery_status,
      secondaryStatus: info.parcel.status_second,
      paymentStatus: info.parcel.payment_status,
      paymentText: info.parcel.payment_status_text,
      displayStatus: info.parcel.status_second 
        ? `${info.parcel.delivery_status} - ${info.parcel.status_second}`
        : info.parcel.delivery_status
    };
  };

  // Calculate statistics for filtered period (month or specific day)
  const commandesStats = useMemo(() => {
    if (!filteredCommandes || filteredCommandes.length === 0) {
      return {
        total: 0,
        new_parcel: 0,
        parcel_confirmed: 0,
        picked_up: 0,
        distribution: 0,
        in_progress: 0,
        sent: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        waiting_pickup: 0,
        received: 0,
        refuse: 0,
        noanswer: 0,
        unreachable: 0,
        hors_zone: 0,
        postponed: 0,
        programmer: 0,
        deux: 0,
        trois: 0,
        envg: 0,
        return_by_amana: 0,
        sent_by_amana: 0,
        pending: 0,
        completed: 0,
        totalSales: 0,
        totalProfit: 0,
        revenue: 0,
        conversionRate: 0
      };
    }

    const stats = {
      total: filteredCommandes.length,
      new_parcel: 0,
      parcel_confirmed: 0,
      picked_up: 0,
      distribution: 0,
      in_progress: 0,
      sent: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
      waiting_pickup: 0,
      received: 0,
      refuse: 0,
      noanswer: 0,
      unreachable: 0,
      hors_zone: 0,
      postponed: 0,
      programmer: 0,
      deux: 0,
      trois: 0,
      envg: 0,
      return_by_amana: 0,
      sent_by_amana: 0,
      pending: 0,
      completed: 0,
      totalSales: 0,
      totalProfit: 0,
      revenue: 0,
      conversionRate: 0
    };

    filteredCommandes.forEach(commande => {
      const tracking = getTrackingStatus(commande.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || commande.statut || '';
      const secondaryStatus = tracking?.secondaryStatus || commande.statut_second || '';
      
      const statusUpper = deliveryStatus.toUpperCase();
      const secondaryUpper = secondaryStatus.toUpperCase();
      
      if (statusUpper === 'NEW_PARCEL' || statusUpper.includes('NOUVEAU')) stats.new_parcel++;
      else if (statusUpper === 'PARCEL_CONFIRMED' || statusUpper.includes('CONFIRM')) stats.parcel_confirmed++;
      else if (statusUpper === 'PICKED_UP' || statusUpper.includes('RAMASSÉ')) stats.picked_up++;
      else if (statusUpper === 'DISTRIBUTION' || statusUpper.includes('DISTRIBUTION')) stats.distribution++;
      else if (statusUpper === 'IN_PROGRESS' || statusUpper.includes('EN COURS')) stats.in_progress++;
      else if (statusUpper === 'SENT' || statusUpper.includes('EXPÉDIÉ')) stats.sent++;
      else if (statusUpper === 'DELIVERED' || statusUpper.includes('LIVRÉ')) stats.delivered++;
      else if (statusUpper === 'RETURNED' || statusUpper.includes('RETOURNÉ')) stats.returned++;
      else if (statusUpper === 'CANCELLED' || statusUpper.includes('ANNULÉ')) stats.cancelled++;
      else if (statusUpper === 'WAITING_PICKUP' || statusUpper.includes('ATTENTE')) stats.waiting_pickup++;
      else if (statusUpper === 'RECEIVED' || statusUpper.includes('REÇU')) stats.received++;
      
      if (secondaryUpper === 'REFUSE' || secondaryUpper.includes('REFUSÉ')) stats.refuse++;
      else if (secondaryUpper === 'NOANSWER' || secondaryUpper.includes('PAS DE RÉPONSE')) stats.noanswer++;
      else if (secondaryUpper === 'UNREACHABLE' || secondaryUpper.includes('INJOIGNABLE')) stats.unreachable++;
      else if (secondaryUpper === 'HORS_ZONE' || secondaryUpper.includes('HORS ZONE')) stats.hors_zone++;
      else if (secondaryUpper === 'POSTPONED' || secondaryUpper.includes('REPORTÉ')) stats.postponed++;
      else if (secondaryUpper === 'PROGRAMMER' || secondaryUpper.includes('PROGRAMMÉ')) stats.programmer++;
      else if (secondaryUpper === 'DEUX' || secondaryUpper.includes('2ÈME')) stats.deux++;
      else if (secondaryUpper === 'TROIS' || secondaryUpper.includes('3ÈME')) stats.trois++;
      else if (secondaryUpper === 'ENVG' || secondaryUpper.includes('EN VOYAGE')) stats.envg++;
      else if (secondaryUpper === 'RETURN_BY_AMANA' || secondaryUpper.includes('RETOUR AMANA')) stats.return_by_amana++;
      else if (secondaryUpper === 'SENT_BY_AMANA' || secondaryUpper.includes('ENVOYÉ AMANA')) stats.sent_by_amana++;

      const finalStates = ['DELIVERED', 'LIVRÉ', 'RETURNED', 'RETOURNÉ', 'CANCELLED', 'ANNULÉ', 'CANCELED'];
      if (!finalStates.includes(statusUpper)) {
        stats.pending++;
      }

      if (statusUpper === 'DELIVERED' || statusUpper.includes('LIVRÉ')) {
        stats.completed++;
        stats.revenue += Number(commande.total || 0);
      }

      const parcelPrice = Number(commande.parcel_price || commande.total || 0);
      stats.totalSales += parcelPrice;

      const profit = Number(commande.profit || 0);
      stats.totalProfit += profit;
    });

    stats.conversionRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

    return stats;
  }, [filteredCommandes, trackingInfoMap]);

  // Monthly summary for the selected period
  const selectedPeriodStats = useMemo(() => {
    const totalDepenses = filteredDepenses.reduce((sum, d) => sum + (Number(d.montant) || 0), 0);
    
    return {
      depenses: totalDepenses,
      profit: commandesStats.totalProfit,
      ventes: commandesStats.totalSales,
      net: commandesStats.totalProfit - totalDepenses
    };
  }, [filteredDepenses, commandesStats]);

  // Generate daily data showing actual daily values (increases/decreases based on what they reach each day)
  const dailyChartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Get commandes and depenses for this specific day only (NOT cumulative)
      const dayCommandes = filteredCommandes.filter(commande => {
        const commandeDate = new Date(commande.date || commande.created_at);
        return commandeDate.getDate() === day;
      });
      
      const dayDepenses = filteredDepenses.filter(depense => {
        const depenseDate = new Date(depense.date || depense.created_at);
        return depenseDate.getDate() === day;
      });
      
      // Calculate DAILY profit and expenses (non-cumulative - these are the actual values for each day)
      const dailyProfit = dayCommandes.reduce((sum, cmd) => sum + (Number(cmd.profit) || 0), 0);
      const dailyExpenses = dayDepenses.reduce((sum, dep) => sum + (Number(dep.montant) || 0), 0);
      
      dailyData.push({
        day: day,
        date: `${day}/${selectedMonth}/${selectedYear}`,
        profit: dailyProfit,      // Actual daily profit - goes up and down each day
        depenses: dailyExpenses,  // Actual daily expenses - goes up and down each day
        netChange: dailyProfit - dailyExpenses,
        orderCount: dayCommandes.length
      });
    }
    
    // If a specific day is selected, only show data up to that day
    if (selectedDay !== null) {
      return dailyData.filter(d => d.day <= selectedDay);
    }
    
    // If current month is selected, only show days up to today
    const currentDate = new Date();
    const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1;
    if (isCurrentMonth) {
      return dailyData.filter(d => d.day <= currentDate.getDate());
    }
    
    return dailyData;
  }, [filteredCommandes, filteredDepenses, selectedYear, selectedMonth, selectedDay]);

  // Recent orders for selected period
  const recentOrders = useMemo(() => {
    if (!filteredCommandes || filteredCommandes.length === 0) return [];
    
    return [...filteredCommandes]
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 10);
  }, [filteredCommandes]);

  // Financial cards for selected period
  const financialCards = [
    { 
      title: "Total dépenses", 
      value: selectedPeriodStats.depenses, 
      icon: DollarSign,
      color: "danger",
      trend: `${filteredDepenses.length} dépenses`
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
      value: selectedPeriodStats.net,
      icon: BookOpen,
      color: selectedPeriodStats.net >= 0 ? "success" : "danger",
      trend: selectedPeriodStats.net >= 0 ? "Positif" : "Négatif"
    },
  ];

  // All status cards with click handlers
  const commandesStatusCards = [
    { title: "Total Commandes", value: commandesStats.total, icon: ShoppingCart, color: "primary", filterKey: "total", filterValue: null },
    { title: "Nouveaux", value: commandesStats.new_parcel, icon: Clock, color: "info", filterKey: "statut", filterValue: "NEW_PARCEL" },
    { title: "Confirmés", value: commandesStats.parcel_confirmed, icon: CheckCircle, color: "success", filterKey: "statut", filterValue: "PARCEL_CONFIRMED" },
    { title: "Ramassés", value: commandesStats.picked_up, icon: Package, color: "purple", filterKey: "statut", filterValue: "PICKED_UP" },
    { title: "Distribution", value: commandesStats.distribution, icon: Truck, color: "warning", filterKey: "statut", filterValue: "DISTRIBUTION" },
    { title: "En cours", value: commandesStats.in_progress, icon: RefreshCw, color: "warning", filterKey: "statut", filterValue: "IN_PROGRESS" },
    { title: "Expédiés", value: commandesStats.sent, icon: Truck, color: "info", filterKey: "statut", filterValue: "SENT" },
    { title: "Livrés", value: commandesStats.delivered, icon: PackageCheck, color: "success", filterKey: "statut", filterValue: "DELIVERED" },
    { title: "Retournés", value: commandesStats.returned, icon: PackageX, color: "danger", filterKey: "statut", filterValue: "RETURNED" },
    { title: "Annulés", value: commandesStats.cancelled, icon: XCircle, color: "secondary", filterKey: "statut", filterValue: "CANCELLED" },
    { title: "En attente", value: commandesStats.waiting_pickup, icon: Clock, color: "warning", filterKey: "statut", filterValue: "WAITING_PICKUP" },
    { title: "Reçus", value: commandesStats.received, icon: PackageCheck, color: "success", filterKey: "statut", filterValue: "RECEIVED" },
    { title: "Refusés", value: commandesStats.refuse, icon: XCircle, color: "danger", filterKey: "statut_second", filterValue: "REFUSE" },
    { title: "Pas de réponse", value: commandesStats.noanswer, icon: Clock, color: "warning", filterKey: "statut_second", filterValue: "NOANSWER" },
    { title: "Injoignables", value: commandesStats.unreachable, icon: AlertCircle, color: "danger", filterKey: "statut_second", filterValue: "UNREACHABLE" },
    { title: "Hors zone", value: commandesStats.hors_zone, icon: MapPin, color: "purple", filterKey: "statut_second", filterValue: "HORS_ZONE" },
    { title: "Reportés", value: commandesStats.postponed, icon: Clock, color: "warning", filterKey: "statut_second", filterValue: "POSTPONED" },
    { title: "Programmés", value: commandesStats.programmer, icon: Calendar, color: "info", filterKey: "statut_second", filterValue: "PROGRAMMER" },
    { title: "2ème tentative", value: commandesStats.deux, icon: RefreshCw, color: "warning", filterKey: "statut_second", filterValue: "DEUX" },
    { title: "3ème tentative", value: commandesStats.trois, icon: RefreshCw, color: "warning", filterKey: "statut_second", filterValue: "TROIS" },
    { title: "En voyage", value: commandesStats.envg, icon: Truck, color: "info", filterKey: "statut_second", filterValue: "ENVG" },
    { title: "Retour Amana", value: commandesStats.return_by_amana, icon: PackageX, color: "danger", filterKey: "statut_second", filterValue: "RETURN_BY_AMANA" },
    { title: "Envoyé Amana", value: commandesStats.sent_by_amana, icon: Package, color: "purple", filterKey: "statut_second", filterValue: "SENT_BY_AMANA" },
    { title: "En attente (total)", value: commandesStats.pending, icon: Clock, color: "warning", filterKey: "pending", filterValue: "pending" }
  ].filter(card => card.value > 0);

  // Handle card click to navigate to orders page with filter
  const handleStatusCardClick = (card) => {
    // Store filter in localStorage to persist across navigation
    if (card.filterKey && card.filterValue) {
      localStorage.setItem('orders_filter_type', card.filterKey);
      localStorage.setItem('orders_filter_value', card.filterValue);
      localStorage.setItem('orders_filter_label', card.title);
    } else if (card.filterKey === "pending") {
      localStorage.setItem('orders_filter_type', 'pending');
      localStorage.setItem('orders_filter_value', 'pending');
      localStorage.setItem('orders_filter_label', card.title);
    } else {
      // For total commandes, clear filters
      localStorage.removeItem('orders_filter_type');
      localStorage.removeItem('orders_filter_value');
      localStorage.removeItem('orders_filter_label');
    }
    
    // Navigate to orders page
    navigate('/orders');
  };

  // Pie chart data - Simplified version
  const pieChartData = useMemo(() => {
    if (!filteredCommandes || filteredCommandes.length === 0) {
      console.log('No filtered commandes for pie chart');
      return [];
    }
    
    const statusCounts = {};
    
    filteredCommandes.forEach(commande => {
      // Get the main status (prioritize delivery status)
      let mainStatus = commande.statut || commande.status || 'UNKNOWN';
      
      // If we have tracking info, use that instead
      const tracking = trackingInfoMap[commande.parcel_code];
      if (tracking && tracking.parcel) {
        mainStatus = tracking.parcel.delivery_status || mainStatus;
      }
      
      // Clean up the status
      let cleanStatus = mainStatus.toUpperCase();
      
      // Map common status variations
      if (cleanStatus.includes('LIVR') || cleanStatus === 'DELIVERED') cleanStatus = 'DELIVERED';
      else if (cleanStatus.includes('RETOUR') || cleanStatus === 'RETURNED') cleanStatus = 'RETURNED';
      else if (cleanStatus.includes('ANNUL') || cleanStatus === 'CANCELLED' || cleanStatus === 'CANCELED') cleanStatus = 'CANCELLED';
      else if (cleanStatus.includes('NOUVEAU') || cleanStatus === 'NEW_PARCEL') cleanStatus = 'NEW_PARCEL';
      else if (cleanStatus.includes('CONFIRM') || cleanStatus === 'PARCEL_CONFIRMED') cleanStatus = 'PARCEL_CONFIRMED';
      else if (cleanStatus.includes('RAMASS') || cleanStatus === 'PICKED_UP') cleanStatus = 'PICKED_UP';
      else if (cleanStatus.includes('DISTRIB') || cleanStatus === 'DISTRIBUTION') cleanStatus = 'DISTRIBUTION';
      else if (cleanStatus.includes('EN COURS') || cleanStatus === 'IN_PROGRESS') cleanStatus = 'IN_PROGRESS';
      else if (cleanStatus.includes('EXPEDI') || cleanStatus === 'SENT') cleanStatus = 'SENT';
      else if (cleanStatus.includes('ATTENTE') || cleanStatus === 'WAITING_PICKUP') cleanStatus = 'WAITING_PICKUP';
      else if (cleanStatus.includes('REÇU') || cleanStatus === 'RECEIVED') cleanStatus = 'RECEIVED';
      
      // Count the status
      statusCounts[cleanStatus] = (statusCounts[cleanStatus] || 0) + 1;
    });
    
    console.log('Status counts for pie chart:', statusCounts);
    
    // Convert to array format for pie chart
    const pieData = Object.entries(statusCounts)
      .map(([name, value]) => ({
        name: name,
        value: value,
        color: PIE_COLORS[name] || getStatusColor(name)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    console.log('Final pie chart data:', pieData);
    
    return pieData;
  }, [filteredCommandes, trackingInfoMap]);

  // Unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    filteredCommandes.forEach(order => {
      const tracking = getTrackingStatus(order.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || order.statut;
      const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
      
      if (deliveryStatus) statuses.add(deliveryStatus);
      if (secondaryStatus && secondaryStatus !== '') statuses.add(secondaryStatus);
    });
    return Array.from(statuses).sort();
  }, [filteredCommandes, trackingInfoMap]);

  // Filtered recent orders
  const filteredRecentOrders = useMemo(() => {
    if (statusFilter === "all") return recentOrders;
    
    return recentOrders.filter(order => {
      const tracking = getTrackingStatus(order.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || order.statut;
      const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
      
      return deliveryStatus === statusFilter || secondaryStatus === statusFilter;
    });
  }, [recentOrders, statusFilter, trackingInfoMap]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('MAD', '').trim();
  };

  const copyTrackingLink = (parcelCode) => {
    const link = `${window.location.origin}/track/${parcelCode}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Lien de suivi copié !");
    });
  };

  // Export handlers
  const handleDownload = (format) => {
    if (format === 'excel') {
      exportToExcel();
    } else if (format === 'pdf') {
      exportToPDF();
    }
  };

  const getPeriodDisplayText = () => {
    if (selectedDay) {
      return `${selectedDay} ${monthNames[selectedMonth - 1]} ${selectedYear}`;
    }
    return `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  };

  const exportToExcel = () => {
    try {
      const periodText = getPeriodDisplayText();
      
      const financialData = [
        [`Tableau de bord - ${periodText}`],
        [],
        ['Aperçu Financier'],
        ['Métrique', 'Valeur (MAD)'],
        ['Total dépenses', selectedPeriodStats.depenses || 0],
        ['Profit total', commandesStats.totalProfit],
        ['Total des ventes', commandesStats.totalSales],
        ['Revenu net', selectedPeriodStats.net],
        [],
        ['Statistiques des Commandes'],
        ['Statut', 'Nombre'],
        ['Total Commandes', commandesStats.total],
        ...Object.entries(commandesStats)
          .filter(([key, value]) => 
            !['totalSales', 'totalProfit', 'revenue', 'conversionRate', 'pending', 'completed'].includes(key) && 
            typeof value === 'number' && 
            value > 0
          )
          .map(([key, value]) => {
            const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return [displayName, value];
          }),
        [],
        ['Commandes Récentes'],
        ['Client', 'Code', 'Date', 'Total', 'Statut']
      ];
      
      filteredRecentOrders.forEach(order => {
        const tracking = getTrackingStatus(order.parcel_code);
        const deliveryStatus = tracking?.deliveryStatus || order.statut;
        financialData.push([
          order.parcel_receiver || 'Client',
          order.parcel_code || `#${order.id}`,
          new Date(order.date || order.created_at).toLocaleDateString('fr-FR'),
          order.parcel_price || 0,
          statusLabels[deliveryStatus] || deliveryStatus
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(financialData);
      XLSX.utils.book_append_sheet(wb, ws, `Dashboard_${periodText.replace(/ /g, '_')}`);
      XLSX.writeFile(wb, `dashboard_${periodText.replace(/ /g, '_')}.xlsx`);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Erreur lors de la génération du fichier Excel.');
    }
  };

  const exportToPDF = () => {
    try {
      const periodText = getPeriodDisplayText();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setTextColor(92, 2, 2);
      doc.text(`Tableau de bord - ${periodText}`, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Aperçu Financier', 14, 40);
      
      const financialData = [
        ['Métrique', 'Valeur (MAD)'],
        ['Total dépenses', `${selectedPeriodStats.depenses.toLocaleString()} DH`],
        ['Profit total', `${commandesStats.totalProfit.toLocaleString()} DH`],
        ['Total des ventes', `${commandesStats.totalSales.toLocaleString()} DH`],
        ['Revenu net', `${selectedPeriodStats.net.toLocaleString()} DH`]
      ];

      autoTable(doc, {
        startY: 45,
        head: [financialData[0]],
        body: financialData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [92, 2, 2], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Statistiques des Commandes', 14, 20);

      const statusData = [
        ['Statut', 'Nombre'],
        ...Object.entries(commandesStats)
          .filter(([key, value]) => 
            !['totalSales', 'totalProfit', 'revenue', 'conversionRate', 'pending', 'completed'].includes(key) && 
            typeof value === 'number' && 
            value > 0
          )
          .map(([key, value]) => {
            const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return [displayName, value.toString()];
          })
      ];

      autoTable(doc, {
        startY: 25,
        head: [statusData[0]],
        body: statusData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [92, 2, 2], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Commandes Récentes', 14, 20);

      const recentOrdersData = [
        ['Client', 'Code', 'Date', 'Total (DH)', 'Statut'],
        ...filteredRecentOrders.map(order => {
          const tracking = getTrackingStatus(order.parcel_code);
          const deliveryStatus = tracking?.deliveryStatus || order.statut;
          return [
            order.parcel_receiver || 'Client',
            order.parcel_code || `#${order.id}`,
            new Date(order.date || order.created_at).toLocaleDateString('fr-FR'),
            (order.parcel_price || 0).toLocaleString(),
            statusLabels[deliveryStatus] || deliveryStatus
          ];
        })
      ];

      autoTable(doc, {
        startY: 25,
        head: [recentOrdersData[0]],
        body: recentOrdersData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [92, 2, 2], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      doc.save(`dashboard_${periodText.replace(/ /g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF.');
    }
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setNotifiedOrderIds(new Set());
    initialProcessingDone.current = false;
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
          
          <NotificationCenter 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAll}
            onDeleteNotification={handleDeleteNotification}
          />

          <DownloadMenu onDownload={handleDownload} />

          <button 
            className={`filters-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtres statuts
          </button>
        </div>
      </div>

      {/* Month/Year/Day Selection Panel */}
      <div className="month-selector-panel">
        <div className="month-selector-content">
          <button onClick={goToPreviousMonth} className="month-nav-btn">
            <ChevronLeft size={20} />
          </button>
          
          <div className="month-year-display">
            <Calendar size={20} className="calendar-icon" />
            <select 
              value={selectedMonth} 
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value));
                setSelectedDay(null);
              }}
              className="month-select"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                setSelectedDay(null);
              }}
              className="year-select"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            {/* Day Selection Dropdown */}
            <div className="day-selector-wrapper">
              <select 
                value={selectedDay === null ? "" : selectedDay} 
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDay(value === "" ? null : parseInt(value));
                }}
                className="day-select"
              >
                <option value="">Tous les jours</option>
                {availableDays.map(day => (
                  <option key={day} value={day}>Jour {day}</option>
                ))}
              </select>
              {selectedDay && (
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="clear-day-btn"
                  title="Afficher tout le mois"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>
          
          <button onClick={goToNextMonth} className="month-nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
        
        {filteredCommandes.length === 0 && (
          <div className="no-data-message">
            <AlertCircle size={16} />
            <span>Aucune donnée pour {getPeriodDisplayText()}</span>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel dashboard-filter">
          <div className="filter-row">
            <div className="filter-group">
              <label>Filtrer par statut</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setStatusFilter("all")} 
              className="btn-clear-filters"
            >
              <XCircle size={16} />
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Financial Stats Cards */}
      <div className="section-title">
        <h3>Aperçu financier - {getPeriodDisplayText()}</h3>
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

      {/* Commandes Status Cards - CLICKABLE */}
      <div className="section-title" style={{ marginTop: '2rem' }}>
        <h3>Statistiques des commandes</h3>
        <p>Tous les statuts en temps réel - Cliquez sur une carte pour filtrer les commandes</p>
      </div>
      <div className="stats-grid status-grid">
        {commandesStatusCards.map((card) => (
          <div 
            key={card.title} 
            className={`stat-card ${card.color} clickable`}
            onClick={() => handleStatusCardClick(card)}
            style={{ cursor: 'pointer' }}
            title={`Cliquez pour voir toutes les commandes ${card.title.toLowerCase()}`}
          >
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
        {/* Period Summary - DAILY VALUES CHART (increases/decreases based on what they reach each day) */}
        <div className="chart-card">
          <div className="chart-header">
            <BarChart3 size={18} />
            <h3>Évolution quotidienne - Profit vs Dépenses</h3>
          </div>
          <div className="chart-container">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart 
                  data={dailyChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d6cc" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false}
                    label={{ value: 'Jour du mois', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6b5752' }}
                  />
                  <YAxis 
                    tick={{ fontFamily: "Lato", fontSize: 12, fill: "#6b5752" }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `${(value / 1000).toFixed(0)}k`;
                      } else {
                        return value.toString();
                      }
                    }}
                    domain={[0, 'auto']}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value, name) => [`${formatCurrency(value)} DH`, name]}
                    labelFormatter={(label) => `Jour ${label}`}
                    labelStyle={{ fontWeight: 'bold', color: '#5c0202' }}
                  />

                  {/* RED LINE for Dépenses (DAILY values - goes up and down) */}
                  <Line
                    type="monotone"
                    dataKey="depenses"
                    name="Dépenses du jour"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6, fill: "#ef4444", stroke: "white", strokeWidth: 2 }}
                  />
                  
                  {/* GREEN LINE for Profit (DAILY values - goes up and down) */}
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit du jour"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6, fill: "#10b981", stroke: "white", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Aucune donnée pour cette période</div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <PieChart size={18} />
            <h3>Répartition des statuts</h3>
          </div>
          <div className="pie-chart-container">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => {
                      const displayName = statusLabels[name] || name;
                      const shortName = displayName.length > 12 ? displayName.substring(0, 10) + '..' : displayName;
                      return `${shortName} ${(percent * 100).toFixed(0)}%`;
                    }}
                    labelLine={{ stroke: '#6b5752', strokeWidth: 1 }}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const displayName = statusLabels[name] || name;
                      return [`${value} commande${value > 1 ? 's' : ''}`, displayName];
                    }}
                    contentStyle={{ 
                      fontFamily: "Lato", 
                      borderRadius: 8, 
                      border: "1px solid #e0d6cc", 
                      background: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 280,
                color: '#6b5752'
              }}>
                <AlertCircle size={32} />
                <p style={{ marginTop: '1rem' }}>Aucune donnée de statut disponible</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {filteredCommandes.length} commandes trouvées
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders-section">
        <div className="section-title">
          <h3>Commandes récentes - {getPeriodDisplayText()}</h3>
          {statusFilter !== "all" && (
            <span className="filter-badge">
              Filtré par: {statusLabels[statusFilter] || statusFilter}
            </span>
          )}
        </div>
        <div className="recent-orders-card full-width">
          <div className="orders-list">
            {filteredRecentOrders.length > 0 ? (
              filteredRecentOrders.map((order) => {
                const tracking = getTrackingStatus(order.parcel_code);
                const deliveryStatus = tracking?.deliveryStatus || order.statut;
                const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
                const paymentStatus = tracking?.paymentStatus || order.payment_status;
                const paymentText = tracking?.paymentText || order.payment_status_text;
                const StatusIcon = statusIcons[deliveryStatus] || statusIcons[secondaryStatus] || Package;
                
                return (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-main">
                        <span 
                          className="status-circle" 
                          style={{ backgroundColor: getStatusColor(deliveryStatus) }}
                        ></span>
                        <div>
                          <p className="order-client">{order.parcel_receiver || "Client"}</p>
                          <p className="order-details">
                            {order.parcel_code || `#${order.id}`} • {new Date(order.date || order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className="order-total">{formatCurrency(order.parcel_price || 0)} DH</p>
                    </div>
                    <div className="order-footer">
                      <div className="status-badges">
                        <div 
                          className="status-badge-row"
                          style={{ 
                            backgroundColor: `${getStatusColor(deliveryStatus)}15`,
                            border: `1px solid ${getStatusColor(deliveryStatus)}30`
                          }}
                        >
                          <StatusIcon size={14} style={{ color: getStatusColor(deliveryStatus) }} />
                          <span style={{ color: getStatusColor(deliveryStatus) }}>
                            {statusLabels[deliveryStatus] || deliveryStatus}
                          </span>
                        </div>
                        {secondaryStatus && secondaryStatus !== '' && (
                          <div 
                            className="status-badge-row secondary"
                            style={{ 
                              backgroundColor: `${getStatusColor(secondaryStatus)}15`,
                              border: `1px solid ${getStatusColor(secondaryStatus)}30`,
                              marginLeft: '4px'
                            }}
                          >
                            <AlertCircle size={14} style={{ color: getStatusColor(secondaryStatus) }} />
                            <span style={{ color: getStatusColor(secondaryStatus) }}>
                              {statusLabels[secondaryStatus] || secondaryStatus}
                            </span>
                          </div>
                        )}
                        {paymentText && paymentText !== '' && (
                          <div 
                            className="status-badge-row payment"
                            style={{ 
                              backgroundColor: `${getStatusColor(paymentStatus)}15`,
                              border: `1px solid ${getStatusColor(paymentStatus)}30`,
                              marginLeft: '4px'
                            }}
                          >
                            <CreditCard size={14} style={{ color: getStatusColor(paymentStatus) }} />
                            <span style={{ color: getStatusColor(paymentStatus) }}>
                              {paymentText}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => copyTrackingLink(order.parcel_code)}
                        className="btn-icon copy"
                        title="Copier le lien de suivi"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <AlertCircle size={24} />
                <p>Aucune commande pour {getPeriodDisplayText()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="summary-card" style={{ marginTop: '1.5rem' }}>
        <h3>Résumé financier - {getPeriodDisplayText()}</h3>
        <div className="summary-item">
          <span>Total des ventes</span>
          <span className="amount positive">{formatCurrency(commandesStats.totalSales)} DH</span>
        </div>
        <div className="summary-item">
          <span>Profit total</span>
          <span className="amount positive">{formatCurrency(commandesStats.totalProfit)} DH</span>
        </div>
        <div className="summary-item">
          <span>Dépenses totales</span>
          <span className="amount negative">{formatCurrency(selectedPeriodStats.depenses)} DH</span>
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
          <span className={`amount ${selectedPeriodStats.net >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(selectedPeriodStats.net)} DH
          </span>
        </div>
      </div>
    </div>
  );
}