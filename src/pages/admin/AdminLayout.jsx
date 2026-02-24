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
  LogOut 
} from "lucide-react";
import { logoutFromSlice, selectAuthUser } from "../../store/store";
import "../../css/AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectAuthUser);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Updated nav items with root paths
  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/books", icon: BookOpen, label: "Livres" },
    { to: "/orders", icon: ShoppingCart, label: "Commandes" },
    { to: "/expenses", icon: Receipt, label: "Dépenses" },
    { to: "/finance", icon: TrendingUp, label: "Finance" },
    { to: "/users", icon: Users, label: "Utilisateurs" },
    { to: "/messages", icon: Mail, label: "Messages" },
    { to: "/profile", icon: User, label: "Profil" },
  ];

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

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Fantasia</h2>
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