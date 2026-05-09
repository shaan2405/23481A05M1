function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function relativeTime(date) {
  if (!date) return "";
  const deltaMs = Date.now() - date.getTime();
  const abs = Math.abs(deltaMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  if (minutes < 60) return `${minutes || 1}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function typeColor(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("event")) return "#54d6ff";
  if (t.includes("result")) return "#7c5cff";
  if (t.includes("placement")) return "#44ffb0";
  return "#b8c3e6";
}

function NotificationCard({ notification }) {
  const date = safeDate(notification?.timestamp);
  const color = typeColor(notification?.type);

  return (
    <div className="card">
      <div className="cardTop">
        <div className="badgeRow">
          <span className="badge" title="Notification type">
            <span className="dot" style={{ background: color }} />
            {notification?.type || "Notification"}
          </span>
        </div>

        <div className="time" title={date ? date.toLocaleString() : ""}>
          {date ? `${relativeTime(date)} · ${date.toLocaleString()}` : ""}
        </div>
      </div>

      <p className="message">{notification?.message || ""}</p>
      {notification?.details ? (
        <p className="details">{notification.details}</p>
      ) : null}
    </div>
  );
}

export default NotificationCard;