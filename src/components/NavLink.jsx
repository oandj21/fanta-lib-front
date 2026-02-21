import "../css/NavLink.css";

export function NavLink({ href, children, className = "", activeClassName = "", ...props }) {
  const isActive = window.location.pathname === href;
  
  return (
    <a
      href={href}
      className={`nav-link-custom ${className} ${isActive ? activeClassName : ''}`}
      {...props}
    >
      {children}
    </a>
  );
}