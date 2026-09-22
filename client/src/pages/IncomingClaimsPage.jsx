import { useCallback, useEffect, useState } from "react";
import {
  FiCheckCircle as CheckCircle2,
  FiClock as Clock3,
  FiMapPin as MapPin,
  FiPackage as PackageCheck,
  FiUser as UserRound,
} from "react-icons/fi";
import { toast } from "react-toastify";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import StatusPill from "../components/common/StatusPill";
import { getIncomingClaims, markClaimCollected } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { formatDate, listFrom, pluralize, recipientName } from "../utils/format";

const IncomingClaimsPage = () => {
  const [claims, setClaims] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [workingId, setWorkingId] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const data = await getIncomingClaims(); setClaims(listFrom(data, ["claims", "incomingClaims", "items", "data"])); } catch (requestError) { setError(getErrorMessage(requestError, "We couldn’t load incoming requests.")); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const collected = async (claim) => { const claimId = claim._id || claim.id; setWorkingId(claimId); try { await markClaimCollected(claimId); toast.success("Handover marked as collected. Thank you!"); await load(); } catch (requestError) { toast.error(getErrorMessage(requestError, "We couldn’t update that handover.")); } finally { setWorkingId(""); } };
  return <div className="page-stack"><PageHeader eyebrow="Pickup coordination" title="Requests for your books" description="When a handover is complete, mark it collected so both sides have a clear record." />{loading ? <PageLoader label="Loading requests…" /> : error ? <ErrorNotice onRetry={load}>{error}</ErrorNotice> : claims.length ? <section className="claim-list">{claims.map((claim) => { const donation = claim.donation || claim.bookDonation || {}; const status = claim.status || "reserved"; const completed = ["collected", "completed", "cancelled"].includes(status.toLowerCase()); return <article key={claim._id || claim.id} className="claim-card"><div className="claim-card__heading"><div><p className="eyebrow">{donation.category || "Book donation"}</p><h2>{donation.title || claim.donationTitle || "Books requested"}</h2><p className="muted">Requested {formatDate(claim.createdAt)}</p></div><StatusPill status={status} /></div><div className="claim-card__facts"><span><UserRound /> {recipientName(claim)}</span><span><PackageCheck /> {pluralize(claim.quantity ?? claim.requestedQuantity, "copy", "copies")}</span>{donation.pickupCity && <span><MapPin /> {donation.pickupCity}</span>}<span><Clock3 /> {completed ? "Handover closed" : "Awaiting collection"}</span></div>{!completed && <footer><button type="button" className="button button--small" disabled={workingId === (claim._id || claim.id)} onClick={() => collected(claim)}><CheckCircle2 /> {workingId === (claim._id || claim.id) ? "Updating…" : "Mark collected"}</button></footer>}</article>; })}</section> : <EmptyState title="No requests yet" description="When a school or NGO reserves one of your listings, it will appear here." />}</div>;
};

export default IncomingClaimsPage;
