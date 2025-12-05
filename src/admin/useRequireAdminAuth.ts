import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useRequireAdminAuth() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const resp = await fetch("/api/admin/auth/state", {
          credentials: "include",
        });
        const data = await resp.json();

        if (cancelled) return;

        // If admin is not set up or not authenticated - redirect to login/setup
        if (!data.isAuthenticated || data.firstRun) {
          navigate("/admin", { replace: true });
        } else {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          // If check failed - redirect to login as well
          navigate("/admin", { replace: true });
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return ready;
}
