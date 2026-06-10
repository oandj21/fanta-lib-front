// pages/admin/Fournisseurcommand.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLivres,
  selectLivresLoading,
  fetchLivres,
} from "../../store/store";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  X,
  XCircle,
  Truck,
  BookOpen,
  Package,
  Layers,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import XLSX from "xlsx-js-style";
import "../../css/Fournisseurcommand.css";

// Function to generate consistent color for a category (same as AdminBooks)
const getCategoryColor = (category) => {
  if (!category) return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
  
  // Generate a hash from the category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) - hash) + category.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Predefined color palettes for better aesthetics
  const colorPalettes = [
    { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }, // Blue
    { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }, // Green
    { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' }, // Orange
    { bg: '#e9d5ff', text: '#6b21a8', border: '#d8b4fe' }, // Purple
    { bg: '#fecdd3', text: '#9f1239', border: '#fda4af' }, // Pink
    { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }, // Amber
    { bg: '#ccfbf1', text: '#115e59', border: '#99f6e4' }, // Teal
    { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }, // Indigo
    { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' }, // Yellow-Orange
    { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' }, // Rose
  ];
  
  const index = Math.abs(hash) % colorPalettes.length;
  return colorPalettes[index];
};

const Fournisseurcommand = () => {
  const dispatch = useDispatch();
  const livres = useSelector(selectLivres);
  const loading = useSelector(selectLivresLoading);

  const [quantities, setQuantities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(80);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("titre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchLivres());
  }, [dispatch]);

  useEffect(() => {
    if (livres && livres.length > 0) {
      const uniqueCategories = [...new Set(livres.map(livre => livre.categorie).filter(Boolean))];
      setCategories(uniqueCategories);
    }
  }, [livres]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy, sortOrder]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleQuantityChange = (livreId, value) => {
    const newValue = parseInt(value) || 0;
    if (newValue >= 0) {
      setQuantities(prev => ({
        ...prev,
        [livreId]: newValue
      }));
    }
  };

  const handleSelectAllWithQuantity = (quantity) => {
    if (quantity > 0) {
      const newQuantities = {};
      filteredLivres.forEach(livre => {
        newQuantities[livre.id] = quantity;
      });
      setQuantities(newQuantities);
      showNotification(`${filteredLivres.length} livres sélectionnés avec quantité ${quantity}`, "info");
    } else {
      showNotification("Veuillez entrer une quantité valide", "error");
    }
  };

  const clearAllSelections = () => {
    setQuantities({});
    showNotification("Toutes les sélections ont été effacées", "info");
  };

  const getSelectedItems = () => {
    return livres.filter(livre => quantities[livre.id] && quantities[livre.id] > 0);
  };

  const exportToExcel = () => {
    const selectedItems = getSelectedItems();

    if (selectedItems.length === 0) {
      showNotification("Aucun livre sélectionné avec quantité", "error");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Calculate totals
    const totalQuantity = selectedItems.reduce((sum, livre) => sum + (quantities[livre.id] || 0), 0);

    // Prepare data with header and summary
    const data = [
      ["COMMANDE FOURNISSEUR"],
      [],
      [`Date: ${new Date().toLocaleDateString()}`, `Heure: ${new Date().toLocaleTimeString()}`],
      [],
      [
        "N°",
        "Titre",
        "Auteur",
        "Catégorie",
        "Quantité Commandée",
      ]
    ];

    // Add book data
    selectedItems.forEach((livre, index) => {
      const quantity = quantities[livre.id];
      data.push([
        index + 1,
        livre.titre || "-",
        livre.auteur || "-",
        livre.categorie || "N/A",
        quantity,
      ]);
    });

    // Add summary row
    data.push(
      [],
      ["", "", "", "TOTAL GÉNÉRAL", totalQuantity],
    );

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Define merges
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 2, c: 2 } },
      { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } },
    ];

    // Column widths
    ws["!cols"] = [
      { wch: 6 },
      { wch: 40 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 }
    ];

    // Auto-filter
    ws["!autofilter"] = {
      ref: `A5:E${selectedItems.length + 5}`
    };

    // ========== STYLES ==========
    
    // Title style (row 0)
    if (ws["A1"]) {
      ws["A1"].s = {
        font: {
          bold: true,
          sz: 20,
          name: "Arial",
          color: { rgb: "FFFFFF" }
        },
        fill: {
          fgColor: { rgb: "5C0202" },
          patternType: "solid"
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "medium", color: { rgb: "5C0202" } },
          bottom: { style: "medium", color: { rgb: "5C0202" } },
          left: { style: "medium", color: { rgb: "5C0202" } },
          right: { style: "medium", color: { rgb: "5C0202" } }
        }
      };
    }

    // Info row style (row 2)
    for (let col = 0; col <= 4; col++) {
      const cell = XLSX.utils.encode_cell({ r: 2, c: col });
      if (ws[cell]) {
        ws[cell].s = {
          font: {
            italic: true,
            sz: 10,
            color: { rgb: "666666" }
          },
          alignment: {
            horizontal: col === 0 ? "left" : "center"
          }
        };
      }
    }

    // Header row style (row 4)
    const headerCols = ["A5", "B5", "C5", "D5", "E5"];
    headerCols.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: {
            bold: true,
            sz: 11,
            name: "Arial",
            color: { rgb: "FFFFFF" }
          },
          fill: {
            fgColor: { rgb: "1B5E20" },
            patternType: "solid"
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "medium", color: { rgb: "0D3B0F" } },
            bottom: { style: "medium", color: { rgb: "0D3B0F" } },
            left: { style: "thin", color: { rgb: "0D3B0F" } },
            right: { style: "thin", color: { rgb: "0D3B0F" } }
          }
        };
      }
    });

    // Data rows styling (rows 5 to selectedItems.length + 4)
    for (let row = 5; row <= selectedItems.length + 4; row++) {
      const isEven = (row - 5) % 2 === 0;
      
      for (let col = 0; col <= 4; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cell]) continue;

        // Base style for all data cells
        ws[cell].s = {
          fill: {
            fgColor: { rgb: isEven ? "F5F5F5" : "FFFFFF" },
            patternType: "solid"
          },
          font: {
            sz: 10,
            name: "Arial",
            color: { rgb: "333333" }
          },
          alignment: {
            horizontal: [0, 4].includes(col) ? "center" : "left",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "E0E0E0" } },
            bottom: { style: "thin", color: { rgb: "E0E0E0" } },
            left: { style: "thin", color: { rgb: "E0E0E0" } },
            right: { style: "thin", color: { rgb: "E0E0E0" } }
          }
        };
      }

      // Quantity column special style (column E - index 4)
      const quantityCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[quantityCell] && ws[quantityCell].v > 0) {
        ws[quantityCell].s = {
          ...ws[quantityCell].s,
          font: {
            ...ws[quantityCell].s.font,
            bold: true,
            color: { rgb: "1B5E20" }
          },
          fill: {
            fgColor: { rgb: "E8F5E9" },
            patternType: "solid"
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        };
      }
    }

    // Summary rows styling (bottom of sheet)
    const summaryStartRow = selectedItems.length + 6;
    for (let row = summaryStartRow; row <= summaryStartRow + 1; row++) {
      for (let col = 0; col <= 4; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cell]) continue;
        
        // Highlight total row
        const isTotalRow = row === summaryStartRow;
        
        ws[cell].s = {
          font: {
            bold: isTotalRow,
            sz: isTotalRow ? 11 : 10,
            color: { rgb: isTotalRow ? "1B5E20" : "555555" }
          },
          fill: {
            fgColor: { rgb: isTotalRow ? "FFF9C4" : "FAFAFA" },
            patternType: "solid"
          },
          alignment: {
            horizontal: col === 3 ? "right" : "center",
            vertical: "center"
          },
          border: isTotalRow ? {
            top: { style: "medium", color: { rgb: "1B5E20" } },
            bottom: { style: "medium", color: { rgb: "1B5E20" } }
          } : {}
        };
      }
    }

    // Add footer with generation info
    const footerRow = summaryStartRow + 4;
    const footerCell = XLSX.utils.encode_cell({ r: footerRow, c: 0 });
    ws[footerCell] = {
      t: 's',
      v: `Document généré le ${new Date().toLocaleString()} - Commande fournisseur`,
      s: {
        font: {
          italic: true,
          sz: 9,
          color: { rgb: "999999" }
        },
        alignment: {
          horizontal: "left"
        }
      }
    };

    // Merge footer cell
    ws["!merges"].push({
      s: { r: footerRow, c: 0 },
      e: { r: footerRow, c: 4 }
    });

    // Freeze header row
    ws["!freeze"] = { xSplit: 0, ySplit: 5 };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Commande Fournisseur");

    // Save file
    XLSX.writeFile(
      wb,
      `commande_fournisseur_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    showNotification("Fichier Excel exporté avec succès !", "success");
  };

  const exportToPDF = () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      showNotification("Aucun livre sélectionné avec quantité", "error");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Commande Fournisseur", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Heure: ${new Date().toLocaleTimeString()}`, 14, 36);
   
    doc.text(`Quantité Totale: ${Object.values(quantities).reduce((a, b) => a + (b || 0), 0)}`, 14, 48);

    const tableData = selectedItems.map((livre, index) => [
      index + 1,
      livre.titre || "-",
      livre.auteur || "-",
      livre.categorie || "N/A",
      quantities[livre.id].toString()
    ]);

    autoTable(doc, {
      startY: 55,
      head: [["N°", "Titre", "Auteur", "Catégorie", "Quantité"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [92, 2, 2],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 70 },
        2: { cellWidth: 45 },
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Signature du fournisseur: ___________________", 14, finalY);
    doc.text("Cachet du fournisseur: ___________________", 14, finalY + 10);
    doc.text(`Document généré le ${new Date().toLocaleString()}`, 14, finalY + 20);

    doc.save(`commande_fournisseur_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification("Fichier PDF exporté avec succès!", "success");
  };

  const handleSubmitCommand = async () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      showNotification("Aucun livre sélectionné avec quantité", "error");
      return;
    }

    if (window.confirm(`Confirmer la commande de ${selectedItems.length} livres ?`)) {
      setIsSubmitting(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQuantities({});
        showNotification("Commande importée avec succès! Toutes les quantités ont été réinitialisées.", "success");
        dispatch(fetchLivres());
      } catch (error) {
        showNotification("Erreur lors de l'importation de la commande", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSortBy("titre");
    setSortOrder("asc");
  };

  const filteredLivres = useMemo(() => {
    return livres.filter(livre => {
      const matchesSearch = searchTerm === "" || 
        (livre.titre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (livre.auteur || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (livre.categorie || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || livre.categorie === categoryFilter;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";
      
      if (sortBy === "prix_achat") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortBy === "stock") {
        aVal = Number(a.stock) || 0;
        bVal = Number(b.stock) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [livres, searchTerm, categoryFilter, sortBy, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLivres = filteredLivres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLivres.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.fv-table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedCount = getSelectedItems().length;

  const getImagesArray = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const getStockStatusClass = (stock) => {
    if (stock === 0) return 'fv-stock-zero';
    if (stock < 5) return 'fv-stock-low';
    if (stock < 20) return 'fv-stock-medium';
    return 'fv-stock-high';
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
      <div className="fv-pagination-container">
        <div className="fv-pagination-info">
          Affichage {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLivres.length)} sur {filteredLivres.length} livre{filteredLivres.length !== 1 ? 's' : ''}
        </div>
        <div className="fv-pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="fv-pagination-btn"
            aria-label="Page précédente"
          >
            &lsaquo;
          </button>
          
          {startPage > 1 && (
            <>
              <button onClick={() => paginate(1)} className="fv-pagination-btn">1</button>
              {startPage > 2 && <span className="fv-pagination-dots">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`fv-pagination-btn ${currentPage === number ? 'fv-pagination-btn-active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="fv-pagination-dots">...</span>}
              <button onClick={() => paginate(totalPages)} className="fv-pagination-btn">{totalPages}</button>
            </>
          )}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="fv-pagination-btn"
            aria-label="Page suivante"
          >
            &rsaquo;
          </button>
        </div>
      </div>
    );
  };

  if (loading && !livres.length) {
    return <div className="fv-loading">Chargement des livres...</div>;
  }

  return (
    <div className="fv-container">
      {notification && (
        <div className={`fv-notification fv-notification-${notification.type}`}>
          {notification.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="fv-header">
        <div>
          <h2>Commandes Fournisseur</h2>
          <p className="fv-subtitle">
            Sélectionnez les livres et quantités à commander
            {filteredLivres.length > 0 && ` - ${filteredLivres.length} livre${filteredLivres.length !== 1 ? 's' : ''} disponible${filteredLivres.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="fv-header-right">
          <button onClick={clearAllSelections} className="fv-btn-secondary">
            <X size={18} />
            Effacer tout
          </button>
        </div>
      </div>

      <div className="fv-stats-grid">
        <div className="fv-stat-card">
          <div className="fv-stat-icon fv-stat-icon-total">
            <BookOpen size={24} />
          </div>
          <div className="fv-stat-content">
            <span className="fv-stat-label">Total livres</span>
            <span className="fv-stat-value">{livres.length}</span>
          </div>
        </div>

        <div className="fv-stat-card">
          <div className="fv-stat-icon fv-stat-icon-selected">
            <Package size={24} />
          </div>
          <div className="fv-stat-content">
            <span className="fv-stat-label">Livres sélectionnés</span>
            <span className="fv-stat-value">{selectedCount}</span>
          </div>
        </div>

        <div className="fv-stat-card">
          <div className="fv-stat-icon fv-stat-icon-quantity">
            <ShoppingCart size={24} />
          </div>
          <div className="fv-stat-content">
            <span className="fv-stat-label">Quantité totale</span>
            <span className="fv-stat-value">
              {Object.values(quantities).reduce((a, b) => a + (b || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="fv-action-row">
        <div className="fv-batch-group">
          <input
            type="number"
            placeholder="Quantité pour tous"
            className="fv-batch-input"
            id="fvBatchQuantity"
            min="0"
          />
          <button
            className="fv-btn-secondary"
            onClick={() => {
              const quantity = parseInt(document.getElementById('fvBatchQuantity').value);
              if (quantity > 0) handleSelectAllWithQuantity(quantity);
              else showNotification("Veuillez entrer une quantité valide", "error");
            }}
          >
            Appliquer à tous
          </button>
        </div>
        <div className="fv-export-group">
          <button className="fv-btn-excel" onClick={exportToExcel} disabled={selectedCount === 0}>
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button className="fv-btn-pdf" onClick={exportToPDF} disabled={selectedCount === 0}>
            <FileText size={18} />
            PDF
          </button>
        </div>
      </div>

      <div className="fv-filters-section">
        <div className="fv-search-wrapper">
          <Search size={18} className="fv-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="fv-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="fv-clear-search">
              <XCircle size={16} />
            </button>
          )}
        </div>

        <button 
          className={`fv-filter-toggle ${showFilters ? 'fv-filter-toggle-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filtres
          <ChevronDown size={16} className={`fv-chevron ${showFilters ? 'fv-chevron-open' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="fv-filter-panel">
          <div className="fv-filter-row">
            <div className="fv-filter-group">
              <label className="fv-filter-label">Catégorie</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="fv-filter-select"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="fv-filter-group">
              <label className="fv-filter-label">Trier par</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="fv-filter-select"
              >
                <option value="titre">Titre</option>
                <option value="auteur">Auteur</option>
                <option value="categorie">Catégorie</option>
                <option value="stock">Stock</option>
              </select>
            </div>

            <div className="fv-filter-group">
              <label className="fv-filter-label">Ordre</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="fv-filter-select"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>

            <button onClick={clearFilters} className="fv-btn-clear-filters">
              <X size={16} />
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {filteredLivres.length === 0 && (
        <div className="fv-no-results">
          <BookOpen size={48} />
          <h3>Aucun livre trouvé</h3>
          <p>Essayez d'ajuster vos filtres ou d'effectuer une nouvelle recherche.</p>
          <button onClick={clearFilters} className="fv-btn-secondary">
            Effacer les filtres
          </button>
        </div>
      )}

      {filteredLivres.length > 0 && (
        <>
          <div className="fv-table-wrapper">
            <table className="fv-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Image</th>
                  <th onClick={() => {
                    setSortBy('titre');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="fv-sortable">
                    Titre {sortBy === 'titre' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => {
                    setSortBy('auteur');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="fv-sortable">
                    Auteur {sortBy === 'auteur' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => {
                    setSortBy('categorie');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="fv-sortable">
                    Catégorie {sortBy === 'categorie' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => {
                    setSortBy('stock');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }} className="fv-sortable" style={{ width: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={14} />
                      Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th style={{ width: '150px' }}>Quantité à Commander</th>
                </tr>
              </thead>
              <tbody>
                {currentLivres.map((livre) => {
                  const bookImages = getImagesArray(livre.images);
                  const isSelected = quantities[livre.id] > 0;
                  const quantityValue = quantities[livre.id] || "";
                  const isPositive = quantityValue > 0;
                  const currentStock = livre.stock ?? 0;
                  const categoryColors = getCategoryColor(livre.categorie);
                  
                  return (
                    <tr key={livre.id} className={isSelected ? 'fv-table-row-selected' : 'fv-table-row'}>
                      <td>
                        {bookImages.length > 0 ? (
                          <img 
                            src={`http://127.0.0.1:8000/storage/${bookImages[0]}`} 
                            alt={livre.titre} 
                            className="fv-book-thumb"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://dummyimage.com/40x52/cccccc/000000&text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="fv-book-thumb-placeholder">
                            <BookOpen size={20} />
                          </div>
                        )}
                      </td>
                      <td className="fv-book-title">{livre.titre || "-"}</td>
                      <td className="fv-book-author">{livre.auteur || "-"}</td>
                      <td>
                        {livre.categorie ? (
                          <span 
                            className="fv-category-badge"
                            style={{
                              backgroundColor: categoryColors.bg,
                              color: categoryColors.text,
                              border: `1px solid ${categoryColors.border}`
                            }}
                          >
                            {livre.categorie}
                          </span>
                        ) : (
                          <span 
                            className="fv-category-badge"
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            N/A
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`fv-stock-badge ${getStockStatusClass(currentStock)}`}>
                          <Layers size={12} />
                          {currentStock} {currentStock === 0 ? '' : currentStock < 5 ? '' : ''}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={quantityValue}
                          onChange={(e) => handleQuantityChange(livre.id, e.target.value)}
                          className={`fv-quantity-input ${isPositive ? 'fv-quantity-input-positive' : 'fv-quantity-input-zero'}`}
                          placeholder="0"
                        />
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
};

export default Fournisseurcommand;