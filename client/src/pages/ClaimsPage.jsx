import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar as CalendarDays,
  FiMapPin as MapPin,
  FiPackage as PackageCheck,
  FiXCircle as XCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import StatusPill from "../components/common/StatusPill";
import { cancelClaim, getMyClaims } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { formatDate, listFrom, pluralize } from "../utils/format";

function pickupDetailsFor(donation) {
  const pickup = donation?.pickup || {};
  return {
    city: donation?.pickupCity || pickup.city,
    address: donation?.pickupAddress || pickup.address,
    instructions: donation?.pickupInstructions || pickup.instructions,
  };
}

const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyClaims();
      setClaims(listFrom(data, ["claims", "items", "data"]));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "We couldn’t load your requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (claim) => {
    const id = claim._id || claim.id;
    if (!window.confirm("Cancel this book request? The reserved copies will become available again.")) {
      return;
    }

    setWorkingId(id);
    try {
      await cancelClaim(id);
      toast.success("Your request was cancelled and the books are available again.");
      await load();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "We couldn’t cancel that request."));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Your collection plan"
        title="My book requests"
        description="Track reservations and use the confirmed pickup details to arrange each handover."
      />
      {loading ? (
        <PageLoader label="Loading your requests…" />
      ) : error ? (
        <ErrorNotice onRetry={load}>{error}</ErrorNotice>
      ) : claims.length ? (
        <section className="claim-list">
          {claims.map((claim) => {
            const donation = claim.donation || claim.bookDonation || {};
            const pickup = pickupDetailsFor(donation);
            const status = claim.status || "pending";
            const cancelledOrCollected = ["collected", "completed", "cancelled", "received"].includes(
              status.toLowerCase()
            );
            const id = claim._id || claim.id;

            return (
              <article key={id} className="claim-card">
                <div className="claim-card__heading">
                  <div>
                    <p className="eyebrow">{donation.category || "Book request"}</p>
                    <h2>{donation.title || claim.donationTitle || "Requested books"}</h2>
                    <p className="muted">Requested {formatDate(claim.createdAt)}</p>
                  </div>
                  <StatusPill status={status} />
                </div>

                <div className="claim-card__facts">
                  <span>
                    <PackageCheck /> {pluralize(claim.quantity ?? claim.requestedQuantity, "copy", "copies")}
                  </span>
                  {pickup.city && (
                    <span>
                      <MapPin /> {pickup.city}
                    </span>
                  )}
                  <span>
                    <CalendarDays />
                    {cancelledOrCollected
                      ? status.toLowerCase() === "cancelled"
                        ? "Request cancelled"
                        : "Collection complete"
                      : "Pickup to be arranged"}
                  </span>
                </div>

                {(pickup.address || pickup.instructions) && !cancelledOrCollected && (
                  <div className="claim-card__note">
                    {pickup.address && <p><strong>Pickup:</strong> {pickup.address}</p>}
                    {pickup.instructions && <p><strong>Instructions:</strong> {pickup.instructions}</p>}
                  </div>
                )}

                {!cancelledOrCollected && (
                  <footer>
                    <button
                      type="button"
                      className="button button--danger button--small"
                      disabled={workingId === id}
                      onClick={() => cancel(claim)}
                    >
                      <XCircle /> {workingId === id ? "Cancelling…" : "Cancel request"}
                    </button>
                  </footer>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="No book requests yet"
          description="Explore listings from donors and reserve the copies your learners need."
          action={<Link className="button button--small" to="/books">Browse available books</Link>}
        />
      )}
    </div>
  );
};

export default ClaimsPage;
