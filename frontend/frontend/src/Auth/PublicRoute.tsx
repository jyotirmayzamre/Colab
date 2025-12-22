import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { authenticated, authChecked, user } = useAuth();
  const location = useLocation();

  if (!authChecked) {
    return <div></div>;
  }

  if (authenticated) {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");

    if (next && next.startsWith("/")) {
      return <Navigate to={next} replace />;
    }

    return <Navigate to={`/home/${user.user_id}`} replace />;
  }

  return children;
};

export default PublicRoute;