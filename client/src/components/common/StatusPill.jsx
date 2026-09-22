import { humanize } from "../../utils/format";

const toneFor = (status = "") => {
  const normalized = status.toLowerCase();
  if (["available", "active", "approved", "completed", "collected", "received", "partially_claimed"].includes(normalized)) return "success";
  if (["pending", "reserved", "requested", "ready", "accepted", "pickup_scheduled"].includes(normalized)) return "warning";
  if (["cancelled", "rejected", "expired", "unavailable"].includes(normalized)) return "danger";
  return "neutral";
};

const StatusPill = ({ status, children }) => (
  <span className={`status-pill status-pill--${toneFor(status)}`}>{children || humanize(status || "Unknown")}</span>
);

export default StatusPill;
