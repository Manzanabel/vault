import { Navigate, Outlet } from "react-router";
import { useMeQuery } from "./store/store";

function App() {
  const { data, isLoading } = useMeQuery();

  if (isLoading) {
    return <div role="status">Loading…</div>;
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default App;
