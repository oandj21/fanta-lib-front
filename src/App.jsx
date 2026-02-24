// src/App.jsx
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Livres from "./pages/Livres";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBooks from "./pages/admin/AdminBooks";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTracker from "./pages/admin/AdminTracker"; // Add this import
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminProfile from "./pages/admin/AdminProfile";

const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/livres" element={<Livres />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            
            {/* Login route */}
            <Route path="/login" element={<AdminLogin />} />
            
            {/* Admin routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
            </Route>
            
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminBooks />} />
            </Route>
            
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOrders />} />
            </Route>

            {/* Add Tracker route */}
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminTracker />} />
            </Route>
            
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminExpenses />} />
            </Route>
            
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminFinance />} />
            </Route>
            
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminUsers />} />
            </Route>
            
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminMessages />} />
            </Route>
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminProfile />} />
            </Route>
            
            {/* Redirect old /admin routes */}
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/books" element={<Navigate to="/books" replace />} />
            <Route path="/admin/orders" element={<Navigate to="/orders" replace />} />
            <Route path="/admin/tracker" element={<Navigate to="/tracker" replace />} />
            <Route path="/admin/expenses" element={<Navigate to="/expenses" replace />} />
            <Route path="/admin/finance" element={<Navigate to="/finance" replace />} />
            <Route path="/admin/users" element={<Navigate to="/users" replace />} />
            <Route path="/admin/profile" element={<Navigate to="/profile" replace />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </Provider>
);

export default App;