import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, X } from "lucide-react";
import "../css/DownloadMenu.css";

export default function DownloadMenu({ onDownload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onDownload(selectedFormat);
    setShowConfirm(false);
    setIsOpen(false);
    setSelectedFormat(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedFormat(null);
  };

  return (
    <div className="download-menu-wrapper" ref={menuRef}>
      <button 
        className={`download-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download size={18} />
        <span>Exporter</span>
      </button>

      {isOpen && !showConfirm && (
        <div className="download-menu">
          <div className="download-menu-header">
            <h4>Exporter les données</h4>
            <button onClick={() => setIsOpen(false)} className="close-menu">
              <X size={16} />
            </button>
          </div>
          <div className="download-options">
            <button 
              className="download-option"
              onClick={() => handleFormatSelect('excel')}
            >
              <FileSpreadsheet size={20} />
              <div className="option-text">
                <span className="option-title">Excel</span>
                <span className="option-desc">Format .xlsx pour analyse</span>
              </div>
            </button>
            <button 
              className="download-option"
              onClick={() => handleFormatSelect('pdf')}
            >
              <FileText size={20} />
              <div className="option-text">
                <span className="option-title">PDF</span>
                <span className="option-desc">Format .pdf pour impression</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="download-confirm">
          <div className="confirm-content">
            <h4>Confirmer l'export</h4>
            <p>
              Voulez-vous exporter les données au format{' '}
              <strong>{selectedFormat === 'excel' ? 'Excel' : 'PDF'}</strong> ?
            </p>
            <div className="confirm-actions">
              <button onClick={handleCancel} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleConfirm} className="btn-confirm">
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}