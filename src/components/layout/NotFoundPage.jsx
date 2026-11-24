import { Link, useLocation } from "react-router-dom";
import EmptyState from "../ui/EmptyState";
/** Route path="*": any URL that no other route matched. */
function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <EmptyState
      icon="🧭"
      title="Page not found"
      message={<>Nothing lives at <span className="not-found-path">{pathname}</span>.</>}
      action={<Link className="btn btn-primary btn-md" to="/">Go to the shop</Link>}
    />
  );
}
export default NotFoundPage;
