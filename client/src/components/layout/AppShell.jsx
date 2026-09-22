import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell as Bell,
  FiBookOpen as BookHeart,
  FiBookOpen as BookOpen,
  FiChevronRight as ChevronRight,
  FiClipboard as ClipboardCheck,
  FiGrid as LayoutDashboard,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiPlus as Plus,
  FiShield as ShieldCheck,
  FiUser as UserRound,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/AuthContext";
import { displayRole } from "../../utils/format";

const navForRole = (role) => {
  const shared = [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard }];
  if (role === "donor") {
    return [
      ...shared,
      { to: "/donations/new", label: "Donate books", icon: Plus },
      { to: "/my-donations", label: "My donations", icon: BookOpen },
      { to: "/incoming-claims", label: "Requests", icon: ClipboardCheck },
    ];
  }
  if (role === "ngo" || role === "school") {
    return [
      ...shared,
      { to: "/books", label: "Find books", icon: BookOpen },
      { to: "/claims", label: "My requests", icon: ClipboardCheck },
    ];
  }
  if (role === "admin") {
    return [
      ...shared,
      { to: "/admin", label: "Admin overview", icon: ShieldCheck },
      { to: "/admin/users", label: "People", icon: Users },
      { to: "/admin/donations", label: "All donations", icon: BookOpen },
    ];
  }
  return shared;
};

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = navForRole(user?.role);
  const name = user?.name || user?.organisationName || user?.organizationName || user?.schoolName || "Member";
  const unread = Number(user?.unreadNotifications || user?.unreadNotificationCount || 0);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("You’ve been signed out safely.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("We couldn’t sign you out. Please try again.");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      {menuOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={closeMenu} />}
      <aside className={`side-nav ${menuOpen ? "side-nav--open" : ""}`} aria-label="Main navigation">
        <div className="brand brand--app">
          <BookHeart aria-hidden="true" />
          <span>rebooked</span>
          <button className="icon-button side-nav__close" onClick={closeMenu} aria-label="Close navigation"><X /></button>
        </div>
        <div className="side-nav__workspace">
          <span className="workspace-avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <span>{displayRole(user?.role)}</span>
          </div>
        </div>
        <nav className="side-nav__links">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight className="nav-link__arrow" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <div className="side-nav__footer">
          <NavLink to="/profile" onClick={closeMenu} className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
            <UserRound aria-hidden="true" /><span>Profile & settings</span>
          </NavLink>
          <button className="nav-link nav-link--button" type="button" onClick={handleLogout}>
            <LogOut aria-hidden="true" /><span>Sign out</span>
          </button>
        </div>
      </aside>
      <section className="app-frame">
        <header className="top-bar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="top-bar__crumb"><span>{displayRole(user?.role)} space</span><b>{location.pathname === "/dashboard" ? "Overview" : "Library"}</b></div>
          <div className="top-bar__actions">
            <NavLink to="/notifications" className="icon-button notification-button" aria-label="Notifications">
              <Bell aria-hidden="true" />
              {unread > 0 && <span className="notification-badge">{unread > 9 ? "9+" : unread}</span>}
            </NavLink>
            <NavLink to="/profile" className="account-chip">
              <span className="account-chip__avatar">{name.slice(0, 1).toUpperCase()}</span>
              <span className="account-chip__name">{name}</span>
            </NavLink>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </section>
    </div>
  );
};

export default AppShell;
