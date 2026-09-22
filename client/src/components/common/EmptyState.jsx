import { FiBookOpen as BookOpenCheck } from "react-icons/fi";

const EmptyState = ({ icon: Icon = BookOpenCheck, title = "Nothing here yet", description, action }) => (
  <section className="empty-state">
    <span className="empty-state__icon" aria-hidden="true"><Icon /></span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </section>
);

export default EmptyState;
