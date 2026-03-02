// components/ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isActive, loading } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

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
    return <div className="loading-screen">Chargement...</div>;
  }

  if (!isAuthenticated || !isActive) {
    // Redirect to login page at /login
    return <Navigate to="/login" replace />;
  }

  return children;
}