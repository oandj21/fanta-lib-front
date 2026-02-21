import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUtilisateur } from "../../store/store"; // Adjust the import path as needed
import "../../css/AdminProfile.css";

export default function AdminProfile() {
  const dispatch = useDispatch();
  const { utilisateur } = useSelector((state) => state.auth);
  
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleLabels = {
    super_admin: "Super Administrateur",
    admin: "Administrateur",
    user: "Utilisateur",
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Validation
    if (newPwd.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // Call the API to update the user with the new password
      const result = await dispatch(updateUtilisateur({
        id: utilisateur.id,
        password: newPwd,
        // Note: The current password verification should be done on the backend
        // You might want to add a separate endpoint for password change
        // that verifies the current password first
      })).unwrap();

      setSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      // Handle error from API
      if (typeof err === 'string') {
        setError(err);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors du changement de mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-profile">
      <div className="profile-header">
        <h2>Mon Profil</h2>
        <p>Vos informations personnelles</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {utilisateur?.name?.charAt(0) || 'U'}
          </div>
          <div className="profile-title">
            <h3>{utilisateur?.name || 'Nom non défini'}</h3>
            <p className="profile-role">{roleLabels[utilisateur?.role] || "Utilisateur"}</p>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="info-item">
            <span className="info-label">Nom complet</span>
            <span className="info-value">{utilisateur?.full_name || utilisateur?.name || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Adresse email</span>
            <span className="info-value">{utilisateur?.email || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Rôle</span>
            <span className="info-value role-badge">
              {roleLabels[utilisateur?.role] || "Utilisateur"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Statut</span>
            <span className={`info-value status-badge ${utilisateur?.is_active ? 'active' : 'inactive'}`}>
              {utilisateur?.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      <div className="password-card">
        <h3>Changer le mot de passe</h3>

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Mot de passe actuel</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="toggle-password"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <div className="password-input-wrapper">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="toggle-password"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="toggle-password"
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert success">
              <span className="alert-icon">✓</span>
              Mot de passe mis à jour avec succès !
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}