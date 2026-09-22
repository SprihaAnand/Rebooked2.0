const StatCard = ({ icon: Icon, label, value, detail, tone = "violet" }) => (
  <article className={`stat-card stat-card--${tone}`}>
    <span className="stat-card__icon" aria-hidden="true">{Icon && <Icon />}</span>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  </article>
);

export default StatCard;
