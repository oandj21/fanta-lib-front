// components/ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isActive, loading, utilisateur } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check localStorage directly as a backup
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("utilisateur");
    
    if (token && user) {
      // If we have localStorage items but Redux state is not set,
      // we need to wait for Redux to sync
      setIsChecking(false);
    } else {
      setIsChecking(false);
    }
  }, []);

  if (loading || isChecking) {
    return (
      <div className="loading-screen" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated || !isActive) {
    // Redirect to login page at /login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const userRole = utilisateur?.role;
    
    if (requiredRole === 'admin' && !(userRole === 'admin' || userRole === 'super_admin')) {
      // Redirect non-admins to dashboard
      return <Navigate to="/dashboard" replace />;
    }
    
    if (requiredRole === 'super_admin' && userRole !== 'super_admin') {
      // Redirect non-super-admins to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}