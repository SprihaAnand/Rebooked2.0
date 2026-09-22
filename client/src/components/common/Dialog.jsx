import { useEffect } from "react";
import { FiX as X } from "react-icons/fi";

const Dialog = ({ title, children, onClose, labelledBy = "dialog-title" }) => {
  useEffect(() => {
    const handleEscape = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog__header">
          <h2 id={labelledBy}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        {children}
      </section>
    </div>
  );
};

export default Dialog;
