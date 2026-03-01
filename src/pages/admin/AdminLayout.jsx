// pages/admin/AdminLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Users,
  Mail, 
  User,
  LogOut,
  Shield
} from "lucide-react";
import { logoutFromSlice, selectAuthUser } from "../../store/store";
import "../../css/AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectAuthUser);

  // Check user role
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  const isUser = currentUser?.role === 'user';

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Update document title based on current route
  useEffect(() => {
    const pageTitle = getPageTitle();
    document.title = `${pageTitle} - Fantasia`;
  }, [location.pathname]);

  // Updated nav items with root paths - filter based on role
  const getNavItems = () => {
    const items = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
      { to: "/books", icon: BookOpen, label: "Livres" },
      { to: "/orders", icon: ShoppingCart, label: "Commandes" },
      { to: "/expenses", icon: Receipt, label: "Dépenses" },
      { to: "/finance", icon: TrendingUp, label: "Finance" },
      { to: "/profile", icon: User, label: "Profil" },
    ];

    // Add Users menu only for Super Admin and Admin
    if (isSuperAdmin || isAdmin) {
      items.splice(5, 0, { to: "/users", icon: Users, label: "Utilisateurs" });
    }

    // Add Messages menu only for Super Admin and Admin
    if (isSuperAdmin || isAdmin) {
      items.splice(6, 0, { to: "/messages", icon: Mail, label: "Messages" });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    dispatch(logoutFromSlice());
    navigate("/login", { replace: true });
  };

  const handleNavClick = (e, to) => {
    e.preventDefault();
    navigate(to);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser?.name) return "U";
    return currentUser.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get current page title
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.to === location.pathname);
    return currentItem?.label || "Administration";
  };

  // Get role badge
  const getRoleBadge = () => {
    switch(currentUser?.role) {
      case 'super_admin':
        return { text: 'Super Admin', icon: Shield, color: 'bg-primary' };
      case 'admin':
        return { text: 'Admin', icon: Shield, color: 'bg-info-10' };
      default:
        return { text: 'Utilisateur', icon: null, color: 'bg-muted' };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.jpeg" alt="Fantasia Logo" className="circular-logo" />
            <h2>Fantasia</h2>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <a
                key={to}
                href={to}
                onClick={(e) => handleNavClick(e, to)}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitials()}
            </div>
            <div className="user-details">
              <p className="user-name">{currentUser?.name || "Utilisateur"}</p>
              <p className="user-email">{currentUser?.email || "email@exemple.com"}</p>
              <div className={`role-badge-small ${roleInfo.color}`}>
                {RoleIcon && <RoleIcon size={12} />}
                {roleInfo.text}
              </div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">
              <LogOut size={16} />
            </span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1>{getPageTitle()}</h1>
          <div className="header-right">
            <span className="welcome-text">
              Bonjour, {currentUser?.name?.split(" ")[0] || "Admin"}
            </span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}