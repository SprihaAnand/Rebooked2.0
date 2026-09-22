const PageHeader = ({ eyebrow, title, description, action, children }) => (
  <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-header__description">{description}</p>}
      {children}
    </div>
    {action && <div className="page-header__action">{action}</div>}
  </header>
);

export default PageHeader;
