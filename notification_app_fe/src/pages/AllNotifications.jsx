import { useCallback, useEffect, useState } from "react";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../services/notificationService";
import { logEvent } from "../lib/logger";
import { STATIC_NOTIFICATIONS } from "../data/staticNotifications";

const TYPE_OPTIONS = ["All", "Event", "Result", "Placement", "News", "Alert", "Reminder"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const TYPE_PRIORITY = {
  Alert: 6,
  Placement: 5,
  Event: 4,
  Result: 3,
  Reminder: 2,
  News: 1
};

function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("idle"); // idle | loading | ready
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const sortByPriorityAndTime = (data) =>
    [...data].sort((a, b) => {
      const priorityA = TYPE_PRIORITY[a?.type] || 0;
      const priorityB = TYPE_PRIORITY[b?.type] || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const loadNotifications = useCallback(async () => {
    try {
      setStatus("loading");
      const result = await fetchNotifications({
        page,
        limit,
        notificationType: filter
      });
      const data = sortByPriorityAndTime(result.notifications);

      await logEvent({
        stack: "frontend",
        level: "info",
        pkg: "api",
        message: `Notifications fetched successfully (status=${result.status}, page=${page}, limit=${limit}, type=${filter})`
      });

      setNotifications(data);
      setStatus("ready");

      await logEvent({
        stack: "frontend",
        level: "info",
        pkg: "state",
        message: "Notification state updated successfully"
      });
    } catch (error) {
      const fallback = sortByPriorityAndTime(
        filter === "All"
          ? STATIC_NOTIFICATIONS
          : STATIC_NOTIFICATIONS.filter((item) => item.type === filter)
      );
      setNotifications(fallback.slice(0, limit));
      setStatus("ready");
      await logEvent({
        stack: "frontend",
        level: "warn",
        pkg: "api",
        message: `Failed to fetch notifications (page=${page}, limit=${limit}, type=${filter}) :: ${error?.message || "unknown error"}`
      });
    }
  }, [filter, limit, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const visibleNotifications = notifications;

  return (
    <div className="container">
      <div className="header">
        <div className="titleWrap">
          <h1>Campus Notifications</h1>
          <p>Stage-based notification board with ranking and type filters.</p>
        </div>

        <div className="toolbar">
          <select
            className="input"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
            aria-label="Notifications per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="Filters">
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip ${filter === t ? "chipActive" : ""}`}
            onClick={() => {
              setPage(1);
              setFilter(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid" aria-live="polite">
        {status === "loading" ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="card skeleton" style={{ height: 92 }} />
          ))
        ) : visibleNotifications.length === 0 ? (
          <div className="empty">
            No notifications available for this type.
          </div>
        ) : (
          visibleNotifications.map((notification) => (
            <NotificationCard
              key={notification.id || `${notification.type}-${notification.timestamp}-${notification.message}`}
              notification={notification}
            />
          ))
        )}
      </div>

      <div className="toolbar" style={{ marginTop: 14, justifyContent: "space-between" }}>
        <span className="time">
          Page {page} - Showing {visibleNotifications.length} item(s)
        </span>
        <div className="chips">
          <button
            type="button"
            className="chip"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || status === "loading"}
          >
            Previous
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={status === "loading" || notifications.length < limit}
            title={
              notifications.length < limit
                ? "No further page inferred from API response length"
                : "Load next page"
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AllNotifications;