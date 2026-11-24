/**
 * Reusable button.
 * variant: "primary" | "secondary" | "ghost" | "danger"    size: "sm" | "md" | "lg"
 * isLoading shows a spinner and disables the button. Other props (onClick, type, disabled...) pass through.
 */
function Button({ variant = "primary", size = "md", fullWidth = false, isLoading = false, disabled, children, ...rest }) {
  const className = ["btn", `btn-${variant}`, `btn-${size}`, fullWidth ? "btn-block" : ""].join(" ").trim();
  return (
    <button className={className} disabled={disabled || isLoading} aria-busy={isLoading} {...rest}>
      {isLoading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
export default Button;