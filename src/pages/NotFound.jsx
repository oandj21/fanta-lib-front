import "../css/NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page non trouvée</h2>
          <p className="not-found-text">
            Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="not-found-actions">
            <a href="/" className="btn-primary">
              Retour à l'accueil
            </a>
            <a href="/livres" className="btn-outline">
              Voir nos livres
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}