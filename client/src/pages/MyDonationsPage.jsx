import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus as Plus } from "react-icons/fi";
import DonationCard from "../components/book/DonationCard";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import { getMyDonations } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { listFrom } from "../utils/format";

const MyDonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await getMyDonations(); setDonations(listFrom(data, ["donations", "items", "data"])); }
    catch (requestError) { setError(getErrorMessage(requestError, "We couldn’t load your donations.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => filter === "all" ? donations : donations.filter((donation) => (donation.status || "available").toLowerCase() === filter), [donations, filter]);

  return <div className="page-stack">
    <PageHeader eyebrow="Your giving library" title="My donations" description="Keep every listing accurate and see who is waiting to collect it." action={<Link className="button" to="/donations/new"><Plus /> List more books</Link>} />
    <div className="segmented-control" role="tablist" aria-label="Filter donations">
      {["all", "available", "partially_claimed", "claimed", "withdrawn"].map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All listings" : value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</button>)}
    </div>
    {loading ? <PageLoader label="Loading your donations…" /> : error ? <ErrorNotice onRetry={load}>{error}</ErrorNotice> : shown.length ? <section className="donation-grid">{shown.map((donation) => <DonationCard key={donation._id || donation.id} donation={donation} showOwner={false} action={<Link className="button button--ghost button--small" to={`/donations/${donation._id || donation.id}`}>Manage listing</Link>} />)}</section> : <EmptyState title={filter === "all" ? "Your donation shelf is waiting" : "No donations in this state"} description={filter === "all" ? "List the first set of books you would like to share with a nearby school or NGO." : "Try a different filter to see another part of your giving activity."} action={filter === "all" ? <Link className="button button--small" to="/donations/new">List books</Link> : null} />}
  </div>;
};

export default MyDonationsPage;
