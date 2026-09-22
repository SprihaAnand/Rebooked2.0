import { FiLoader as LoaderCircle } from "react-icons/fi";

const PageLoader = ({ label = "Loading your library…", compact = false }) => (
  <div className={compact ? "inline-loader" : "page-loader"} role="status" aria-live="polite">
    <LoaderCircle className="spin" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default PageLoader;
