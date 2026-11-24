/** Friendly placeholder for empty lists, no results and errors. */
function EmptyState({ icon = "🛒", title, message, action, tone = "neutral" }) {
  return (
    <div className={`empty-state empty-${tone}`}>
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
export default EmptyState;