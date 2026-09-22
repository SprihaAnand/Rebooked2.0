import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight as ArrowRight,
  FiBookOpen as BookHeart,
  FiBookOpen as BookOpen,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiPackage as PackageOpen,
} from "react-icons/fi";
import { useAuth } from "../auth/AuthContext";
import DonationCard from "../components/book/DonationCard";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import StatCard from "../components/common/StatCard";
import { getDashboard } from "../services/donationService";
import { formatNumber, listFrom } from "../utils/format";
import { getErrorMessage } from "../services/API";

const statValue = (stats, keys) => {
  for (const key of keys) if (stats?.[key] != null) return formatNumber(stats[key]);
  return "0";
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const data = await getDashboard();
      setDashboard(data?.dashboard || data || {});
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Your overview is temporarily unavailable."));
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const config = useMemo(() => {
    if (user?.role === "donor") return {
      greeting: "Your giving, in motion.",
      description: "See what you have shared and keep handovers moving smoothly.",
      action: <Link className="button" to="/donations/new">Donate books <ArrowRight /></Link>,
      stats: [
        { icon: BookHeart, label: "Books offered", keys: ["booksDonated", "totalBooks", "booksOffered"], tone: "coral" },
        { icon: PackageOpen, label: "Live donations", keys: ["donationCount", "activeDonations", "listedDonations"], tone: "violet" },
        { icon: ClipboardCheck, label: "Awaiting pickup", keys: ["activeClaims", "pendingClaims", "reservedClaims"], tone: "amber" },
        { icon: CheckCircle2, label: "Books collected", keys: ["collectedBooks", "completedClaims", "collectionsCompleted"], tone: "mint" },
      ],
      recentTitle: "Your latest listings",
      recentKeys: ["recentDonations", "donations", "recentListings"],
      emptyAction: <Link className="button button--small" to="/donations/new">List your first donation</Link>,
    };
    if (user?.role === "ngo" || user?.role === "school") return {
      greeting: "Find the next useful read.",
      description: "Discover nearby book donations and keep your requests organised.",
      action: <Link className="button" to="/books">Browse available books <ArrowRight /></Link>,
      stats: [
        { icon: BookOpen, label: "Books requested", keys: ["claimedBooks", "booksRequested", "requestedBooks"], tone: "coral" },
        { icon: ClipboardCheck, label: "Active requests", keys: ["activeClaims", "pendingClaims", "requests"], tone: "violet" },
        { icon: PackageOpen, label: "Collections in progress", keys: ["activeClaims", "readyForPickup"], tone: "amber" },
        { icon: CheckCircle2, label: "Books collected", keys: ["collectedBooks", "completedCollections", "receivedBooks"], tone: "mint" },
      ],
      recentTitle: "Your recent requests",
      recentKeys: ["recentClaims", "recommendedDonations", "recentDonations"],
      emptyAction: <Link className="button button--small" to="/books">Explore donations</Link>,
    };
    return {
      greeting: "A healthier book-sharing network.",
      description: "Keep an eye on the community and the impact it is creating.",
      action: <Link className="button" to="/admin">Open admin view <ArrowRight /></Link>,
      stats: [
        { icon: BookHeart, label: "Books in circulation", keys: ["booksInCirculation", "totalBooks"], tone: "coral" },
        { icon: PackageOpen, label: "Donations listed", keys: ["donationCount", "activeDonations"], tone: "violet" },
        { icon: ClipboardCheck, label: "Books claimed", keys: ["claimedBooks", "pendingClaims"], tone: "amber" },
        { icon: CheckCircle2, label: "Books collected", keys: ["collectedBooks", "completedClaims"], tone: "mint" },
      ],
      recentTitle: "Recent activity",
      recentKeys: ["recentDonations", "donations", "activity"],
      emptyAction: null,
    };
  }, [user?.role]);

  if (!dashboard && !error) return <PageLoader label="Building your overview…" />;
  const stats = dashboard?.summary || dashboard?.stats || dashboard?.metrics || dashboard || {};
  const recent = listFrom(dashboard, config.recentKeys).map((item) =>
    item?.donation ? { ...item.donation, status: item.status, createdAt: item.createdAt } : item
  );

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Welcome back" title={config.greeting} description={config.description} action={config.action} />
      {error ? <ErrorNotice onRetry={loadDashboard}>{error}</ErrorNotice> : <>
        <section className="stats-grid">
          {config.stats.map((stat) => <StatCard key={stat.label} {...stat} value={statValue(stats, stat.keys)} />)}
        </section>
        <section className="content-section">
          <div className="section-row"><div><p className="eyebrow">At a glance</p><h2>{config.recentTitle}</h2></div><Link className="text-link text-link--arrow" to={user?.role === "donor" ? "/my-donations" : user?.role === "admin" ? "/admin/donations" : "/claims"}>See all <ArrowRight /></Link></div>
          {recent.length ? <div className="donation-grid">{recent.slice(0, 3).map((donation) => <DonationCard key={donation._id || donation.id || donation.title} donation={donation} showOwner={user?.role !== "donor"} action={<Link className="button button--ghost button--small" to={`/donations/${donation._id || donation.id}`}>View details</Link>} />)}</div> : <EmptyState title="Your next chapter starts here" description={user?.role === "donor" ? "List your first set of books and make them available to nearby organisations." : "New listings will appear here as donors share books."} action={config.emptyAction} />}
        </section>
      </>}
    </div>
  );
};

export default DashboardPage;
