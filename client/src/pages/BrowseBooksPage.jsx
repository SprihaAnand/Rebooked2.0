import { useCallback, useEffect, useState } from "react";
import { FiSearch as Search, FiSliders as SlidersHorizontal } from "react-icons/fi";
import { toast } from "react-toastify";
import DonationCard from "../components/book/DonationCard";
import Dialog from "../components/common/Dialog";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import { claimDonation, listDonations } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { availableQuantity, BOOK_CATEGORIES, BOOK_CONDITIONS, humanize, listFrom, pluralize } from "../utils/format";

const BrowseBooksPage = () => {
  const [filters, setFilters] = useState({ search: "", category: "", condition: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (nextFilters = appliedFilters) => {
    setLoading(true); setError("");
    try { const data = await listDonations(nextFilters); setDonations(listFrom(data, ["donations", "items", "data"])); }
    catch (requestError) { setError(getErrorMessage(requestError, "The book catalogue is temporarily unavailable.")); }
    finally { setLoading(false); }
  }, [appliedFilters]);

  useEffect(() => { load(); }, [load]);
  const applyFilters = (event) => { event.preventDefault(); setAppliedFilters(filters); };
  const clearFilters = () => { const blank = { search: "", category: "", condition: "" }; setFilters(blank); setAppliedFilters(blank); };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Available now" title="Find books for your learners" description="Reserve exactly the number of copies your organisation can use. The donor will see your request and pickup details stay private until a handover is arranged." />
      <form className="catalogue-filters panel" onSubmit={applyFilters}>
        <label className="search-field"><Search aria-hidden="true" /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search by title, author, or ISBN" aria-label="Search available books" /></label>
        <label className="filter-select"><SlidersHorizontal aria-hidden="true" /><select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} aria-label="Filter by category"><option value="">All categories</option>{BOOK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="filter-select"><select value={filters.condition} onChange={(event) => setFilters((current) => ({ ...current, condition: event.target.value }))} aria-label="Filter by condition"><option value="">Any condition</option>{BOOK_CONDITIONS.map((condition) => <option key={condition} value={condition}>{humanize(condition)}</option>)}</select></label>
        <button className="button button--small" type="submit">Search</button>
        {(appliedFilters.search || appliedFilters.category || appliedFilters.condition) && <button className="button button--quiet button--small" type="button" onClick={clearFilters}>Clear</button>}
      </form>
      {loading ? <PageLoader label="Finding available books…" /> : error ? <ErrorNotice onRetry={() => load()}>{error}</ErrorNotice> : donations.length ? <section className="donation-grid">{donations.map((donation) => <DonationCard key={donation._id || donation.id} donation={donation} action={<button className="button button--small" type="button" disabled={availableQuantity(donation) < 1} onClick={() => setSelected(donation)}>{availableQuantity(donation) > 0 ? "Request books" : "No copies left"}</button>} />)}</section> : <EmptyState title="No books match those filters" description="Try another subject, condition, or a broader search." action={<button className="button button--small" type="button" onClick={clearFilters}>Show all books</button>} />}
      {selected && <ClaimDialog donation={selected} onClose={() => setSelected(null)} onClaimed={() => load()} />}
    </div>
  );
};

const ClaimDialog = ({ donation, onClose, onClaimed }) => {
  const maximum = availableQuantity(donation);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const requested = Number(quantity);
    if (!Number.isInteger(requested) || requested < 1 || requested > maximum) { toast.error(`Choose between 1 and ${maximum} copies.`); return; }
    setSubmitting(true);
    try { await claimDonation(donation._id || donation.id, requested); toast.success("Your request has been sent to the donor."); onClose(); onClaimed(); }
    catch (error) { toast.error(getErrorMessage(error, "We couldn’t reserve those books.")); }
    finally { setSubmitting(false); }
  };
  return <Dialog title="Request these books" onClose={onClose} labelledBy="request-books-title"><form className="dialog-form" onSubmit={submit}><p>Request copies of <strong>{donation.title}</strong>. Once reserved, you can coordinate collection through your requests.</p><label className="field"><span>How many copies? <b>*</b></span><input type="number" min="1" max={maximum} value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus required /><small>{pluralize(maximum, "copy", "copies")} currently available</small></label><div className="dialog-form__actions"><button type="button" className="button button--quiet" onClick={onClose}>Not now</button><button type="submit" className="button" disabled={submitting}>{submitting ? "Sending…" : "Send request"}</button></div></form></Dialog>;
};

export default BrowseBooksPage;
