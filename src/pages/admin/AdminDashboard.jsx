import { useEffect, useMemo, useState, useRef } from "react";
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
  User,
  Layers,
  FileText,
  Calendar,
  Copy,
  Eye,
  Info,
  Filter,
  Bell,
  Download
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
import NotificationCenter from "../../components/NotificationCenter";
import DownloadMenu from "../../components/DownloadMenu";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "../../css/AdminDashboard.css";

// Helper to get status color based on status text (same as AdminOrders)
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

// Helper to check if a status is "in progress" (not final)
const isStatusInProgress = (status) => {
  if (!status) return false;
  
  const statusLower = status.toLowerCase();
  
  // Define in-progress statuses (all statuses except final states)
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
  
  // Final states that should NOT trigger notifications
  const finalKeywords = [
    'livré', 'delivered', 'retourné', 'returned', 'annulé', 'cancelled',
    'DELIVERED', 'RETURNED', 'CANCELLED', 'RETURN_BY_AMANA', 'SENT_BY_AMANA'
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
  
  // Use selectors instead of direct state access (better practice)
  const stats = useSelector(selectDashboardStats);
  const monthlyStats = useSelector(selectMonthlyStats);
  const commandes = useSelector(selectCommandes);
  const depenses = useSelector(selectDepenses);

  const [trackingInfoMap, setTrackingInfoMap] = useState({});
  const [loadingTracking, setLoadingTracking] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState(new Set());
  
  // Use ref to track if initial processing has been done
  const initialProcessingDone = useRef(false);

  // Load notifications and notified IDs from localStorage on mount
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

  // Save notified IDs to localStorage
  useEffect(() => {
    localStorage.setItem('notified_order_ids', JSON.stringify(Array.from(notifiedOrderIds)));
  }, [notifiedOrderIds]);

  // FIXED: SHOW ALL COMMANDS WITH STATUS IN PROGRESS IN NOTIFICATIONS - NO DUPLICATES
  useEffect(() => {
    // Only run if we have commandes and initial processing hasn't been done yet
    if (commandes && commandes.length > 0 && !initialProcessingDone.current) {
      
      // Get all order IDs that are currently in our notifications
      const existingNotificationOrderIds = new Set(
        notifications
          .filter(n => n.type === 'commande')
          .map(n => n.orderId)
      );
      
      // Combine with already notified IDs
      const allNotifiedIds = new Set([...Array.from(notifiedOrderIds), ...Array.from(existingNotificationOrderIds)]);
      
      // Find all orders that are in progress and not yet notified
      const inProgressOrders = commandes.filter(order => {
        const status = order.statut || order.status || '';
        return isStatusInProgress(status) && !allNotifiedIds.has(order.id);
      });
      
      if (inProgressOrders.length > 0) {
        console.log(`Found ${inProgressOrders.length} new in-progress orders to notify`);
        
        // Create notifications for each in-progress order
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

        // Update notifications - prepend new ones and keep only last 50
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
        
        // Mark these orders as notified
        const newNotifiedIds = new Set([
          ...Array.from(notifiedOrderIds),
          ...inProgressOrders.map(o => o.id)
        ]);
        setNotifiedOrderIds(newNotifiedIds);
      }
      
      // Mark initial processing as done
      initialProcessingDone.current = true;
    }
  }, [commandes]); // Only depend on commandes

  // Listen for CRUD events - FIXED to prevent duplicates
  useEffect(() => {
    const handleCrudEvent = (event) => {
      const { type, action, item, user } = event.detail;
      
      // Only show notifications for commandes (orders)
      if (type !== 'commande') {
        return;
      }
      
      // Check if the status is in progress
      const status = item.statut || item.status || item.deliveryStatus || '';
      
      // Skip if status is not in progress
      if (!isStatusInProgress(status)) {
        console.log('Skipping notification for non-in-progress order:', status);
        return;
      }
      
      // Skip if this order was already notified (check both state and existing notifications)
      const existingNotification = notifications.find(n => n.orderId === item.id);
      if (existingNotification || notifiedOrderIds.has(item.id)) {
        console.log('Skipping duplicate notification for order:', item.id);
        return;
      }
      
      let message = '';
      let details = '';
      
      switch(action) {
        case 'create':
          message = `📦 Nouvelle commande en cours`;
          details = `${item.parcel_receiver || 'Client'} • ${statusLabels[status] || status}`;
          break;
        case 'update':
          message = `✏️ Commande mise à jour`;
          details = `${item.parcel_receiver || `#${item.id}`} • ${statusLabels[status] || status}`;
          break;
        case 'status_change':
          message = `🔄 Statut de commande modifié`;
          details = `${item.parcel_receiver || `#${item.id}`}: ${statusLabels[item.old_status] || item.old_status} → ${statusLabels[item.new_status] || item.new_status}`;
          break;
        default:
          return;
      }

      const newNotification = {
        id: Date.now() + Math.random() + item.id,
        type,
        action,
        message,
        details,
        timestamp: new Date().toISOString(),
        read: false,
        user: user || 'Système',
        status: status,
        orderId: item.id,
        parcelCode: item.parcel_code,
        clientName: item.parcel_receiver,
        clientPhone: item.parcel_phone,
        city: item.parcel_city,
        address: item.parcel_address,
        parcelPrice: item.parcel_price,
        quantity: item.parcel_prd_qty
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 50));
      
      // Mark this order as notified
      setNotifiedOrderIds(prev => new Set([...Array.from(prev), item.id]));
    };

    window.addEventListener('crud-event', handleCrudEvent);
    return () => window.removeEventListener('crud-event', handleCrudEvent);
  }, [notifiedOrderIds, notifications]);

  // Notification handlers
  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    // Also clear notified IDs when clearing all notifications
    setNotifiedOrderIds(new Set());
    // Reset initial processing flag to allow reprocessing if needed
    initialProcessingDone.current = false;
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Export handlers
  const handleDownload = (format) => {
    if (format === 'excel') {
      exportToExcel();
    } else if (format === 'pdf') {
      exportToPDF();
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const financialData = [
        ['Aperçu Financier'],
        ['Métrique', 'Valeur (MAD)'],
        ['Total dépenses', stats?.total_expenses || 0],
        ['Profit total', commandesStats.totalProfit],
        ['Total des ventes', commandesStats.totalSales],
        ['Revenu net', commandesStats.totalProfit - Number(stats?.total_expenses || 0)],
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
        ['Évolution Mensuelle'],
        ['Mois', 'Dépenses', 'Profit', 'Ventes']
      ];

      // Add monthly data
      monthlyData.forEach(m => {
        financialData.push([m.month, m.depenses, m.profit, m.ventes]);
      });

      // Add recent orders
      financialData.push([], ['Commandes Récentes']);
      financialData.push(['Client', 'Code', 'Date', 'Total', 'Statut']);
      
      recentOrders.forEach(order => {
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

      // Create worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(financialData);
      
      // Style the worksheet
      ws['!cols'] = [
        { wch: 25 }, // First column width
        { wch: 20 }, // Second column width
        { wch: 20 }, // Third column width
        { wch: 20 }  // Fourth column width
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
      XLSX.writeFile(wb, `dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Erreur lors de la génération du fichier Excel. Veuillez réessayer.');
    }
  };

  const exportToPDF = () => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(92, 2, 2);
      doc.text('Tableau de bord - Fantasia', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 28, { align: 'center' });

      // Financial Overview
      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Aperçu Financier', 14, 40);
      
      const financialData = [
        ['Métrique', 'Valeur (MAD)'],
        ['Total dépenses', `${(stats?.total_expenses || 0).toLocaleString()} DH`],
        ['Profit total', `${commandesStats.totalProfit.toLocaleString()} DH`],
        ['Total des ventes', `${commandesStats.totalSales.toLocaleString()} DH`],
        ['Revenu net', `${(commandesStats.totalProfit - Number(stats?.total_expenses || 0)).toLocaleString()} DH`]
      ];

      autoTable(doc, {
        startY: 45,
        head: [financialData[0]],
        body: financialData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [92, 2, 2], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });

      // Orders Statistics
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
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });

      // Monthly Evolution
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Évolution Mensuelle', 14, 20);

      const monthlyTableData = [
        ['Mois', 'Dépenses (DH)', 'Profit (DH)', 'Ventes (DH)'],
        ...monthlyData.map(m => [
          m.month,
          m.depenses.toLocaleString(),
          m.profit.toLocaleString(),
          m.ventes.toLocaleString()
        ])
      ];

      autoTable(doc, {
        startY: 25,
        head: [monthlyTableData[0]],
        body: monthlyTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [92, 2, 2], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' }
        }
      });

      // Recent Orders
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(92, 2, 2);
      doc.text('Commandes Récentes', 14, 20);

      const recentOrdersData = [
        ['Client', 'Code', 'Date', 'Total (DH)', 'Statut'],
        ...recentOrders.map(order => {
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
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 50 }
        }
      });

      // Save the PDF
      doc.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  useEffect(() => {
    // Fetch all dashboard data
    dispatch(fetchDashboardStats());
    dispatch(fetchMonthlyStats());
    dispatch(fetchCommandes());
    dispatch(fetchDepenses());
  }, [dispatch]);

  // Fetch tracking info for real-time status updates
  useEffect(() => {
    if (commandes.length > 0) {
      const fetchAllTrackingInfo = async () => {
        const token = localStorage.getItem("token");
        
        for (const order of commandes) {
          if (order.parcel_code && !trackingInfoMap[order.parcel_code]) {
            setLoadingTracking(prev => ({ ...prev, [order.parcel_code]: true }));
            
            try {
              const response = await axios.get(
                `https://fanta-lib-back-production-76f4.up.railway.app/api/welivexpress/trackparcel`,
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
  }, [commandes]);

  // Helper to get tracking info for an order
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

  // Calculate all commandes statistics with real-time status updates
  const commandesStats = useMemo(() => {
    if (!commandes || commandes.length === 0) {
      return {
        total: 0,
        // Primary status counts
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
        // Secondary status counts
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
        // Summary stats
        pending: 0,
        completed: 0,
        totalSales: 0,
        totalProfit: 0,
        revenue: 0,
        conversionRate: 0
      };
    }

    const stats = {
      total: commandes.length,
      // Primary status counts
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
      // Secondary status counts
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
      // Summary stats
      pending: 0,
      completed: 0,
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
      
      // Count primary statuses
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
      
      // Count secondary statuses
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

      // Count pending orders (not in final state)
      const finalStates = ['DELIVERED', 'LIVRÉ', 'RETURNED', 'RETOURNÉ', 'CANCELLED', 'ANNULÉ'];
      if (!finalStates.includes(statusUpper)) {
        stats.pending++;
      }

      // Count completed orders
      if (statusUpper === 'DELIVERED' || statusUpper.includes('LIVRÉ')) {
        stats.completed++;
        stats.revenue += Number(commande.total || 0);
      }

      // Calculate total sales from all commandes (using parcel_price)
      const parcelPrice = Number(commande.parcel_price || commande.total || 0);
      stats.totalSales += parcelPrice;

      // Calculate total profit from all commandes
      const profit = Number(commande.profit || 0);
      stats.totalProfit += profit;
    });

    // Calculate conversion rate
    stats.conversionRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

    return stats;
  }, [commandes, trackingInfoMap]);

  // Calculate monthly data directly from commandes
  const monthlyData = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    // Create array of last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      last6Months.push({
        month: monthName,
        monthNumber: month,
        year: year,
        key: `${year}-${month}`
      });
    }

    // Calculate totals for each month
    return last6Months.map(monthData => {
      // Filter commandes for this month
      const monthCommandes = commandes.filter(commande => {
        const commandeDate = new Date(commande.date || commande.created_at);
        return commandeDate.getMonth() + 1 === monthData.monthNumber && 
               commandeDate.getFullYear() === monthData.year;
      });

      // Filter depenses for this month
      const monthDepenses = depenses.filter(depense => {
        const depenseDate = new Date(depense.date || depense.created_at);
        return depenseDate.getMonth() + 1 === monthData.monthNumber && 
               depenseDate.getFullYear() === monthData.year;
      });

      // Calculate totals
      const totalDepenses = monthDepenses.reduce((sum, d) => sum + (Number(d.montant) || 0), 0);
      
      // For sales and profit, only count delivered orders
      const deliveredCommandes = monthCommandes.filter(c => {
        const status = (c.statut || '').toUpperCase();
        return status === 'DELIVERED' || status.includes('LIVRÉ');
      });
      
      const totalSales = deliveredCommandes.reduce((sum, c) => sum + (Number(c.parcel_price || c.total || 0)), 0);
      const totalProfit = deliveredCommandes.reduce((sum, c) => sum + (Number(c.profit || 0)), 0);

      return {
        month: monthData.month,
        monthNumber: monthData.monthNumber,
        year: monthData.year,
        depenses: totalDepenses,      // First bar - Dépenses
        profit: totalProfit,           // Second bar - Profit
        ventes: totalSales             // Third bar - Ventes
      };
    });
  }, [commandes, depenses]);

  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    if (!commandes || commandes.length === 0) return [];
    
    return [...commandes]
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5);
  }, [commandes]);

  // Main financial cards - Reordered: Total dépenses, Profit total, Total des ventes, Revenu net
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
      color: (commandesStats.totalProfit - Number(stats?.total_expenses || 0)) >= 0 ? "success" : "danger",
      trend: (commandesStats.totalProfit - Number(stats?.total_expenses || 0)) >= 0 ? "Positif" : "Négatif"
    },
  ];

  // All Commandes Status Cards - Complete list from API
  const commandesStatusCards = [
    {
      title: "Total Commandes",
      value: commandesStats.total,
      icon: ShoppingCart,
      color: "primary"
    },
    {
      title: "Nouveaux",
      value: commandesStats.new_parcel,
      icon: Clock,
      color: "info"
    },
    {
      title: "Confirmés",
      value: commandesStats.parcel_confirmed,
      icon: CheckCircle,
      color: "success"
    },
    {
      title: "Ramassés",
      value: commandesStats.picked_up,
      icon: Package,
      color: "purple"
    },
    {
      title: "Distribution",
      value: commandesStats.distribution,
      icon: Truck,
      color: "warning"
    },
    {
      title: "En cours",
      value: commandesStats.in_progress,
      icon: RefreshCw,
      color: "warning"
    },
    {
      title: "Expédiés",
      value: commandesStats.sent,
      icon: Truck,
      color: "info"
    },
    {
      title: "Livrés",
      value: commandesStats.delivered,
      icon: PackageCheck,
      color: "success"
    },
    {
      title: "Retournés",
      value: commandesStats.returned,
      icon: PackageX,
      color: "danger"
    },
    {
      title: "Annulés",
      value: commandesStats.cancelled,
      icon: XCircle,
      color: "secondary"
    },
    {
      title: "En attente",
      value: commandesStats.waiting_pickup,
      icon: Clock,
      color: "warning"
    },
    {
      title: "Reçus",
      value: commandesStats.received,
      icon: PackageCheck,
      color: "success"
    },
    {
      title: "Refusés",
      value: commandesStats.refuse,
      icon: XCircle,
      color: "danger"
    },
    {
      title: "Pas de réponse",
      value: commandesStats.noanswer,
      icon: Clock,
      color: "warning"
    },
    {
      title: "Injoignables",
      value: commandesStats.unreachable,
      icon: AlertCircle,
      color: "danger"
    },
    {
      title: "Hors zone",
      value: commandesStats.hors_zone,
      icon: MapPin,
      color: "purple"
    },
    {
      title: "Reportés",
      value: commandesStats.postponed,
      icon: Clock,
      color: "warning"
    },
    {
      title: "Programmés",
      value: commandesStats.programmer,
      icon: Calendar,
      color: "info"
    },
    {
      title: "2ème tentative",
      value: commandesStats.deux,
      icon: RefreshCw,
      color: "warning"
    },
    {
      title: "3ème tentative",
      value: commandesStats.trois,
      icon: RefreshCw,
      color: "warning"
    },
    {
      title: "En voyage",
      value: commandesStats.envg,
      icon: Truck,
      color: "info"
    },
    {
      title: "Retour Amana",
      value: commandesStats.return_by_amana,
      icon: PackageX,
      color: "danger"
    },
    {
      title: "Envoyé Amana",
      value: commandesStats.sent_by_amana,
      icon: Package,
      color: "purple"
    },
    {
      title: "En attente (total)",
      value: commandesStats.pending,
      icon: Clock,
      color: "warning"
    }
  ].filter(card => card.value > 0); // Only show statuses that have orders

  // Format month data for chart display - Use calculated monthlyData instead of monthlyStats
  const chartData = monthlyData;

  // Get unique statuses from orders for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    commandes.forEach(order => {
      const tracking = getTrackingStatus(order.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || order.statut;
      const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
      
      if (deliveryStatus) {
        statuses.add(deliveryStatus);
      }
      if (secondaryStatus && secondaryStatus !== '') {
        statuses.add(secondaryStatus);
      }
    });
    return Array.from(statuses).sort();
  }, [commandes, trackingInfoMap]);

  // Filtered orders for recent orders
  const filteredRecentOrders = useMemo(() => {
    if (statusFilter === "all") return recentOrders;
    
    return recentOrders.filter(order => {
      const tracking = getTrackingStatus(order.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || order.statut;
      const secondaryStatus = tracking?.secondaryStatus || order.statut_second;
      
      return deliveryStatus === statusFilter || secondaryStatus === statusFilter;
    });
  }, [recentOrders, statusFilter, trackingInfoMap]);

  // Pie chart data for status distribution - Now shows all statuses with counts
  const pieChartData = useMemo(() => {
    const statusCounts = {};
    
    commandes.forEach(commande => {
      const tracking = getTrackingStatus(commande.parcel_code);
      const deliveryStatus = tracking?.deliveryStatus || commande.statut;
      const secondaryStatus = tracking?.secondaryStatus || commande.statut_second;
      
      if (deliveryStatus && deliveryStatus !== '') {
        statusCounts[deliveryStatus] = (statusCounts[deliveryStatus] || 0) + 1;
      }
      if (secondaryStatus && secondaryStatus !== '') {
        const statusKey = `${secondaryStatus} (secondaire)`;
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      }
    });
    
    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: PIE_COLORS[name.split(' ')[0]] || getStatusColor(name.split(' ')[0])
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 statuses for readability
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

  const copyTrackingLink = (parcelCode) => {
    const link = `${window.location.origin}/track/${parcelCode}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Lien de suivi copié !");
    });
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
          
          {/* Notification Bell */}
          <NotificationCenter 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAll}
            onDeleteNotification={handleDeleteNotification}
          />

          {/* Download Button */}
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

      {/* Financial Stats Cards - Reordered */}
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

      {/* Commandes Status Cards - All Statuses from API */}
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
              {card.title === "Livrés" && card.value > 0 && (
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
        {/* Monthly Evolution Bar Chart - Reordered: Dépenses, Profit, Ventes */}
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
                    formatter={(value, name, props) => {
                      const statusName = props.payload.name;
                      const displayName = statusLabels[statusName.split(' ')[0]] || statusName;
                      return [`${value} commande${value > 1 ? 's' : ''}`, displayName];
                    }}
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

      {/* Recent Orders with Status Badges */}
      <div className="recent-orders-section">
        <div className="section-title">
          <h3>Commandes récentes</h3>
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
                        {/* Status Circle */}
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