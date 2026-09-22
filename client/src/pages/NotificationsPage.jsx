import { useCallback, useEffect, useState } from "react";
import { FiBell as BellRing, FiCheck as CheckCheck, FiClock as Clock3 } from "react-icons/fi";
import EmptyState from "../components/common/EmptyState";
import ErrorNotice from "../components/common/ErrorNotice";
import PageHeader from "../components/common/PageHeader";
import PageLoader from "../components/common/PageLoader";
import { getNotifications, markNotificationsRead } from "../services/donationService";
import { getErrorMessage } from "../services/API";
import { formatDate, listFrom } from "../utils/format";
import { toast } from "react-toastify";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [marking, setMarking] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const data = await getNotifications(); setNotifications(listFrom(data, ["notifications", "items", "data"])); } catch (requestError) { setError(getErrorMessage(requestError, "We couldn’t load notifications.")); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const markAll = async () => { setMarking(true); try { await markNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, read: true, isRead: true }))); toast.success("All caught up."); } catch (requestError) { toast.error(getErrorMessage(requestError, "We couldn’t mark those as read.")); } finally { setMarking(false); } };
  const hasUnread = notifications.some((notification) => !(notification.read || notification.isRead || notification.readAt));
  return <div className="page-stack"><PageHeader eyebrow="Stay in the loop" title="Notifications" description="Updates about requests, reservations, and handovers will appear here." action={hasUnread ? <button className="button button--ghost" type="button" disabled={marking} onClick={markAll}><CheckCheck /> {marking ? "Updating…" : "Mark all read"}</button> : null} />{loading ? <PageLoader label="Loading notifications…" /> : error ? <ErrorNotice onRetry={load}>{error}</ErrorNotice> : notifications.length ? <section className="notification-list">{notifications.map((notification) => { const unread = !(notification.read || notification.isRead || notification.readAt); return <article key={notification._id || notification.id} className={`notification-item ${unread ? "notification-item--unread" : ""}`}><span className="notification-item__icon"><BellRing /></span><div><h2>{notification.title || "Rebooked update"}</h2><p>{notification.message || notification.body || "There is an update waiting for you."}</p><span><Clock3 /> {formatDate(notification.createdAt || notification.date, { hour: "numeric", minute: "2-digit" })}</span></div>{unread && <i aria-label="Unread" />}</article>; })}</section> : <EmptyState icon={BellRing} title="You’re all caught up" description="We’ll let you know when something needs your attention." />}</div>;
};

export default NotificationsPage;
