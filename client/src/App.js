import { Outlet, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import DonationFormPage from "./pages/DonationFormPage";
import MyDonationsPage from "./pages/MyDonationsPage";
import DonationDetailPage from "./pages/DonationDetailPage";
import BrowseBooksPage from "./pages/BrowseBooksPage";
import ClaimsPage from "./pages/ClaimsPage";
import IncomingClaimsPage from "./pages/IncomingClaimsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { AdminDonationsPage, AdminOverviewPage, AdminUsersPage } from "./pages/AdminPages";
import AppShell from "./components/layout/AppShell";
import { GuestOnly, RequireAuth, RequireRole } from "./components/Routes/RouteGuards";

const ProtectedShell = () => <AppShell><Outlet /></AppShell>;

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={4200} theme="light" newestOnTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<ProtectedShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/donations/:id" element={<DonationDetailPage />} />
            <Route element={<RequireRole roles={["donor"]} />}>
              <Route path="/donations/new" element={<DonationFormPage />} />
              <Route path="/my-donations" element={<MyDonationsPage />} />
              <Route path="/incoming-claims" element={<IncomingClaimsPage />} />
            </Route>
            <Route element={<RequireRole roles={["ngo", "school"]} />}>
              <Route path="/books" element={<BrowseBooksPage />} />
              <Route path="/claims" element={<ClaimsPage />} />
            </Route>
            <Route element={<RequireRole roles={["admin"]} />}>
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/donations" element={<AdminDonationsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
