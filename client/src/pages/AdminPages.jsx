import { useCallback, useEffect, useState } from "react";
import {
  FiBookOpen as BookHeart,
  FiCheckCircle as CheckCircle2,
  FiClipboard as ClipboardCheck,
  FiUsers as Users,
} from "react-icons/fi";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import StatCard from "../components/common/StatCard";
import StatusPill from "../components/common/StatusPill";
import { getAdminDonations, getAdminOverview, getAdminUsers } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { displayRole, formatDate, formatNumber, listFrom } from "../utils/format";

const numberOf = (data, keys) => { for (const key of keys) if (data?.[key] != null) return formatNumber(data[key]); return "0"; };

export const AdminOverviewPage = () => {
  const [overview, setOverview] = useState(null); const [error, setError] = useState("");
  const load = useCallback(async () => { setError(""); try { const data = await getAdminOverview(); setOverview(data?.overview || data || {}); } catch (requestError) { setError(getErrorMessage(requestError, "The admin overview is unavailable.")); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!overview && !error) return <PageLoader label="Loading community overview…" />;
  if (error) return <div className="page-stack"><PageHeader eyebrow="Platform health" title="Admin overview" /><ErrorNotice onRetry={load}>{error}</ErrorNotice></div>;
  const stats = overview.stats || overview.metrics || overview;
  return <div className="page-stack"><PageHeader eyebrow="Platform health" title="Admin overview" description="A high-level view of the people and books moving through Rebooked." /><section className="stats-grid"><StatCard icon={Users} label="People registered" value={numberOf(stats, ["users", "totalUsers"])} tone="violet" /><StatCard icon={BookHeart} label="Books listed" value={numberOf(stats, ["books", "totalBooks", "booksListed"])} tone="coral" /><StatCard icon={ClipboardCheck} label="Open requests" value={numberOf(stats, ["openClaims", "pendingClaims", "requests"])} tone="amber" /><StatCard icon={CheckCircle2} label="Completed handovers" value={numberOf(stats, ["completedClaims", "completedCollections"])} tone="mint" /></section></div>;
};

const AdminTable = ({ type }) => {
  const isUsers = type === "users"; const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const data = isUsers ? await getAdminUsers() : await getAdminDonations(); setItems(listFrom(data, isUsers ? ["users", "items", "data"] : ["donations", "items", "data"])); } catch (requestError) { setError(getErrorMessage(requestError, `We couldn’t load ${isUsers ? "people" : "donations"}.`)); } finally { setLoading(false); } }, [isUsers]);
  useEffect(() => { load(); }, [load]);
  const title = isUsers ? "People on Rebooked" : "All donations";
  return <div className="page-stack"><PageHeader eyebrow="Administration" title={title} description={isUsers ? "A read-only view of community accounts." : "A read-only view of current and past book listings."} />{loading ? <PageLoader label={`Loading ${isUsers ? "people" : "donations"}…`} /> : error ? <ErrorNotice onRetry={load}>{error}</ErrorNotice> : items.length ? <section className="panel table-wrap"><table className="data-table"><thead><tr>{isUsers ? <><th>Name</th><th>Role</th><th>Email</th><th>Joined</th></> : <><th>Title</th><th>Donor</th><th>Copies</th><th>Status</th><th>Listed</th></>}</tr></thead><tbody>{items.map((item) => isUsers ? <tr key={item._id || item.id}><td>{item.name || item.organizationName || item.organisationName || item.schoolName || "—"}</td><td><StatusPill status={item.role}>{displayRole(item.role)}</StatusPill></td><td>{item.email || "—"}</td><td>{formatDate(item.createdAt)}</td></tr> : <tr key={item._id || item.id}><td><strong>{item.title || "Untitled donation"}</strong><small>{item.category}</small></td><td>{item.donor?.name || item.donorName || "—"}</td><td>{item.availableQuantity ?? item.quantity ?? 0}</td><td><StatusPill status={item.status || "available"} /></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></section> : <EmptyState title={`No ${isUsers ? "users" : "donations"} yet`} description="This area will populate as the community grows." />}</div>;
};

export const AdminUsersPage = () => <AdminTable type="users" />;
export const AdminDonationsPage = () => <AdminTable type="donations" />;
