import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage as ImagePlus, FiMapPin as MapPin, FiStar as Sparkles } from "react-icons/fi";
import { toast } from "react-toastify";
import PageHeader from "../components/common/PageHeader";
import { createDonation } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { BOOK_CATEGORIES, BOOK_CONDITIONS, humanize } from "../utils/format";

const initialValues = {
  title: "", author: "", isbn: "", category: "", condition: "", quantity: 1,
  description: "", pickupCity: "", pickupAddress: "", pickupInstructions: "", imageUrl: "",
};

const DonationFormPage = () => {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!values.title.trim() || !values.category || !values.condition || !values.pickupCity.trim() || !values.pickupAddress.trim()) {
      toast.error("Please complete the book and pickup details before publishing.");
      return;
    }
    if (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) < 1) {
      toast.error("Please add at least one copy.");
      return;
    }
    setSubmitting(true);
    try {
      await createDonation({ ...values, quantity: Number(values.quantity) });
      toast.success("Your donation is live and ready to be discovered.");
      navigate("/my-donations");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn’t publish this donation."));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page-stack form-page">
      <PageHeader eyebrow="Share a story" title="List books for donation" description="A few clear details help the right school or NGO decide whether these books will be useful." />
      <form className="panel donation-form" onSubmit={submit} noValidate>
        <section className="form-section"><div className="form-section__heading"><span className="form-section__icon"><Sparkles /></span><div><h2>About the books</h2><p>Describe what a recipient will receive.</p></div></div>
          <div className="form-grid">
            <label className="field field--wide"><span>Book title <b>*</b></span><input name="title" value={values.title} onChange={update} placeholder="e.g. The Alchemist" required autoFocus /></label>
            <label className="field"><span>Author</span><input name="author" value={values.author} onChange={update} placeholder="Author name" /></label>
            <label className="field"><span>ISBN</span><input name="isbn" value={values.isbn} onChange={update} placeholder="Optional" /></label>
            <label className="field"><span>Category <b>*</b></span><select name="category" value={values.category} onChange={update} required><option value="">Choose a category</option>{BOOK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="field"><span>Condition <b>*</b></span><select name="condition" value={values.condition} onChange={update} required><option value="">Choose condition</option>{BOOK_CONDITIONS.map((condition) => <option key={condition} value={condition}>{humanize(condition)}</option>)}</select></label>
            <label className="field"><span>Copies available <b>*</b></span><input name="quantity" type="number" min="1" step="1" inputMode="numeric" value={values.quantity} onChange={update} required /></label>
            <label className="field field--wide"><span>Notes for recipients</span><textarea name="description" value={values.description} onChange={update} rows="4" placeholder="Edition, suitable age/grade, subjects covered, or anything else that may help." /></label>
          </div>
        </section>
        <section className="form-section"><div className="form-section__heading"><span className="form-section__icon"><MapPin /></span><div><h2>Pickup details</h2><p>Only a confirmed recipient will receive the full handover information.</p></div></div>
          <div className="form-grid">
            <label className="field"><span>City or locality <b>*</b></span><input name="pickupCity" value={values.pickupCity} onChange={update} placeholder="e.g. Bengaluru" required /></label>
            <label className="field field--wide"><span>Pickup address <b>*</b></span><input name="pickupAddress" value={values.pickupAddress} onChange={update} placeholder="A safe, practical collection address" required /></label>
            <label className="field field--wide"><span>Helpful pickup instructions</span><textarea name="pickupInstructions" value={values.pickupInstructions} onChange={update} rows="3" placeholder="Preferred days, building entry notes, or a contact preference." /></label>
          </div>
        </section>
        <section className="form-section form-section--last"><div className="form-section__heading"><span className="form-section__icon"><ImagePlus /></span><div><h2>Add a cover image <small>Optional</small></h2><p>A public image URL helps the listing stand out. You can leave this blank.</p></div></div>
          <label className="field field--wide"><span>Image URL</span><input type="url" name="imageUrl" value={values.imageUrl} onChange={update} placeholder="https://…" /></label>
        </section>
        <footer className="form-actions"><button type="button" className="button button--quiet" onClick={() => navigate(-1)}>Cancel</button><button type="submit" className="button" disabled={submitting}>{submitting ? "Publishing…" : "Publish donation"}</button></footer>
      </form>
    </div>
  );
};

export default DonationFormPage;
