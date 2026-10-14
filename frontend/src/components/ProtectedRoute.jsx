import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { user, loading, sessionError, refreshUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="animate-pulse text-gray-500">
          Checking your session…
        </p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-gray-600">{sessionError}</p>
        <button
          onClick={refreshUser}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}