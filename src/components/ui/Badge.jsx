/** Small coloured label. tone: "green" | "yellow" | "red" | "blue" | "grey" */
function Badge({ tone = "grey", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export default Badge;