import { FiAlertCircle as AlertCircle } from "react-icons/fi";

const ErrorNotice = ({ children, onRetry }) => (
  <div className="error-notice" role="alert">
    <AlertCircle aria-hidden="true" />
    <div><strong>We couldn’t load this just now.</strong><p>{children}</p></div>
    {onRetry && <button type="button" className="button button--quiet" onClick={onRetry}>Try again</button>}
  </div>
);

export default ErrorNotice;
