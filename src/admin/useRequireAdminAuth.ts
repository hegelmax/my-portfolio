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

        // если админ не настроен или не залогинен — на страницу логина / setup
        if (!data.isAuthenticated || data.firstRun) {
          navigate("/admin", { replace: true });
        } else {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          // если не смогли проверить — тоже выкидываем на логин
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
