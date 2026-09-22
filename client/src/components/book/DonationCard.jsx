import {
  FiBookOpen as BookOpen,
  FiCalendar as CalendarDays,
  FiMapPin as MapPin,
  FiPackage as PackageOpen,
  FiUser as UserRound,
} from "react-icons/fi";
import StatusPill from "../common/StatusPill";
import { availableQuantity, donationOwnerName, formatDate, humanize, pluralize } from "../../utils/format";

const DonationCard = ({ donation, action, showOwner = true }) => {
  const available = availableQuantity(donation);
  const imageUrl = donation?.imageUrl || donation?.image;
  const status = donation?.status || (available > 0 ? "available" : "unavailable");

  return (
    <article className="donation-card">
      <div className="donation-card__art">
        {imageUrl ? <img src={imageUrl} alt={`Cover for ${donation?.title || "donated books"}`} /> : <BookOpen aria-hidden="true" />}
        <StatusPill status={status} />
      </div>
      <div className="donation-card__body">
        <div className="donation-card__title-row">
          <div>
            <span className="eyebrow">{donation?.category || "Books"}</span>
            <h3>{donation?.title || "Untitled donation"}</h3>
            {donation?.author && <p className="muted">by {donation.author}</p>}
          </div>
        </div>
        <div className="donation-card__meta">
          <span><PackageOpen aria-hidden="true" /> {pluralize(available, "copy", "copies")} available</span>
          {donation?.condition && <span>{humanize(donation.condition)}</span>}
        </div>
        {donation?.pickupCity && <p className="card-detail"><MapPin aria-hidden="true" /> {donation.pickupCity}</p>}
        {showOwner && <p className="card-detail"><UserRound aria-hidden="true" /> {donationOwnerName(donation)}</p>}
        {donation?.createdAt && <p className="card-detail"><CalendarDays aria-hidden="true" /> Listed {formatDate(donation.createdAt)}</p>}
        {donation?.description && <p className="donation-card__description">{donation.description}</p>}
        {action && <footer className="donation-card__footer">{action}</footer>}
      </div>
    </article>
  );
};

export default DonationCard;
