import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft as ArrowLeft,
  FiEdit2 as Pencil,
  FiMapPin as MapPin,
  FiSave as Save,
  FiTrash2 as Trash,
  FiX as X,
} from "react-icons/fi";
import { toast } from "react-toastify";
import PageLoader from "../components/common/PageLoader";
import ErrorNotice from "../components/common/ErrorNotice";
import StatusPill from "../components/common/StatusPill";
import {
  getDonation,
  updateDonation,
  withdrawDonation,
} from "../services/donationService";
import { getErrorMessage } from "../services/API";
import {
  availableQuantity,
  donationOwnerName,
  formatDate,
  humanize,
  pluralize,
  BOOK_CONDITIONS,
} from "../utils/format";
import { useAuth } from "../auth/AuthContext";

function pickupFields(donation) {
  const pickup = donation?.pickup || {};
  return {
    city: donation?.pickupCity || pickup.city || "",
    address: donation?.pickupAddress || pickup.address || "",
    instructions: donation?.pickupInstructions || pickup.instructions || "",
  };
}

const DonationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donation, setDonation] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getDonation(id);
      const item = data?.donation || data?.item || data;
      setDonation(item);
      setDraft({ ...item, ...pickupFields(item) });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "That donation could not be found."));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const ownerId = donation?.donor?._id || donation?.donor?.id || donation?.donorId;
  const userId = user?._id || user?.id;
  const ownsDonation = user?.role === "donor" && (!ownerId || String(ownerId) === String(userId));
  const status = donation?.status || (availableQuantity(donation) ? "available" : "unavailable");
  const canEdit = ownsDonation && !["withdrawn", "claimed"].includes(status);
  const canWithdraw = ownsDonation && status !== "withdrawn";

  const update = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await updateDonation(id, {
        title: draft.title,
        author: draft.author,
        condition: draft.condition,
        description: draft.description,
        pickupCity: draft.city,
        pickupAddress: draft.address,
        pickupInstructions: draft.instructions,
      });
      const next = data?.donation || data?.item || { ...donation, ...draft };
      setDonation(next);
      setDraft({ ...next, ...pickupFields(next) });
      setEditing(false);
      toast.success("Your listing has been updated.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "We couldn’t save those changes."));
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    const shouldWithdraw = window.confirm(
      "Withdraw this donation? It will no longer be available to schools or NGOs."
    );
    if (!shouldWithdraw) return;

    setWithdrawing(true);
    try {
      await withdrawDonation(id);
      toast.success("Donation withdrawn.");
      navigate("/my-donations", { replace: true });
    } catch (requestError) {
      toast.error(
        getErrorMessage(
          requestError,
          "We couldn’t withdraw this listing. Cancel active claims first."
        )
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const fullPickup = useMemo(() => {
    const pickup = pickupFields(donation);
    return [pickup.address, pickup.instructions].filter(Boolean);
  }, [donation]);

  if (!donation && !error) return <PageLoader label="Opening donation…" />;
  if (error) {
    return (
      <div className="page-stack">
        <ErrorNotice onRetry={load}>{error}</ErrorNotice>
        <Link className="text-link" to="/dashboard"><ArrowLeft /> Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page-stack detail-page">
      <Link className="text-link text-link--arrow" to={user?.role === "donor" ? "/my-donations" : "/books"}>
        <ArrowLeft /> Back to {user?.role === "donor" ? "my donations" : "available books"}
      </Link>

      <div className="detail-hero panel">
        <div className="detail-hero__cover">
          {donation.imageUrl || donation.image ? (
            <img src={donation.imageUrl || donation.image} alt={`Cover for ${donation.title}`} />
          ) : (
            <span>{donation?.category?.slice(0, 1) || "B"}</span>
          )}
        </div>
        <div className="detail-hero__copy">
          <div className="detail-hero__status">
            <StatusPill status={status} />
            <span>{pluralize(availableQuantity(donation), "copy", "copies")} available</span>
          </div>
          <p className="eyebrow">{donation.category || "Books"}</p>
          <h1>{donation.title || "Untitled donation"}</h1>
          {donation.author && <p className="detail-hero__author">by {donation.author}</p>}
          <p className="muted">Listed by {donationOwnerName(donation)} · {formatDate(donation.createdAt)}</p>
        </div>
        {(canEdit || canWithdraw) && !editing && (
          <div className="detail-hero__actions">
            {canEdit && (
              <button type="button" className="button button--ghost" onClick={() => setEditing(true)}>
                <Pencil /> Edit listing
              </button>
            )}
            {canWithdraw && (
              <button
                type="button"
                className="button button--danger"
                disabled={withdrawing}
                onClick={withdraw}
              >
                <Trash /> {withdrawing ? "Withdrawing…" : "Withdraw"}
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <form className="panel compact-edit-form" onSubmit={save}>
          <div className="section-row">
            <div>
              <p className="eyebrow">Donor controls</p>
              <h2>Update this listing</h2>
            </div>
            <StatusPill status={status} />
          </div>
          <div className="form-grid">
            <label className="field field--wide">
              <span>Title</span>
              <input name="title" value={draft.title || ""} onChange={update} required />
            </label>
            <label className="field">
              <span>Author</span>
              <input name="author" value={draft.author || ""} onChange={update} />
            </label>
            <label className="field">
              <span>Condition</span>
              <select name="condition" value={draft.condition || "good"} onChange={update}>
                {BOOK_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{humanize(condition)}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>City</span>
              <input name="city" value={draft.city || ""} onChange={update} required />
            </label>
            <label className="field field--wide">
              <span>Description</span>
              <textarea rows="3" name="description" value={draft.description || ""} onChange={update} />
            </label>
            <label className="field field--wide">
              <span>Pickup address</span>
              <input name="address" value={draft.address || ""} onChange={update} required />
            </label>
            <label className="field field--wide">
              <span>Pickup instructions</span>
              <textarea rows="3" name="instructions" value={draft.instructions || ""} onChange={update} />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="button button--quiet"
              onClick={() => {
                setDraft({ ...donation, ...pickupFields(donation) });
                setEditing(false);
              }}
            >
              <X /> Cancel
            </button>
            <button type="submit" className="button" disabled={saving}>
              <Save /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="detail-grid">
          <section className="panel detail-copy">
            <h2>About these books</h2>
            <p>{donation.description || "The donor has not added extra notes for this donation."}</p>
            <dl>
              <div><dt>Condition</dt><dd>{humanize(donation.condition || "not specified")}</dd></div>
              <div><dt>ISBN</dt><dd>{donation.isbn || "Not specified"}</dd></div>
              <div><dt>Pickup area</dt><dd>{pickupFields(donation).city || "To be arranged"}</dd></div>
            </dl>
          </section>
          <aside className="panel pickup-card">
            <span className="pickup-card__icon"><MapPin /></span>
            <h2>{ownsDonation ? "Your pickup details" : "Pickup will be arranged"}</h2>
            {ownsDonation ? (
              <>
                {fullPickup.length ? fullPickup.map((line) => <p key={line}>{line}</p>) : <p>Add an address before coordinating a handover.</p>}
              </>
            ) : (
              <p>Request this listing from the catalogue. Confirmed collection information will be shared in your claim.</p>
            )}
            {!ownsDonation && <Link className="button button--small" to="/books">Browse books</Link>}
          </aside>
        </div>
      )}
    </div>
  );
};

export default DonationDetailPage;
