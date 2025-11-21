import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import './LoginPage.scss';

type Mode = "login" | "setup";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  //const [initialized, setInitialized] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // >>> Вот реализация TODO: определяем режим по /api/admin/state.php
  useEffect(() => {
    let cancelled = false;

    const fetchState = async () => {
      try {
        const resp = await fetch("/api/admin/auth/state", {
          credentials: "include",
        });
        if (!resp.ok) {
          throw new Error("Failed to fetch admin state");
        }
        const data = await resp.json();
        if (!cancelled) {
          setMode(data.firstRun ? "setup" : "login");
          //setInitialized(true);
        }
      } catch (e) {
        if (!cancelled) {
          // если что-то пошло не так — считаем, что админ уже есть
          setMode("login");
          //setInitialized(true);
        }
      }
    };

    fetchState();

    return () => {
      cancelled = true;
    };
  }, []);
  // <<< конец TODO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "setup" && password !== password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      if (mode === "setup") {
        // первый вход — создаём админа, PHP сохранит хэш в конфиге
        const resp = await fetch("/api/admin/auth/setup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, password }),
        });
        if (!resp.ok) throw new Error("Setup failed");
      } else {
        // обычный логин
        const resp = await fetch("/api/admin/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, password }),
        });
        if (!resp.ok) throw new Error("Invalid credentials");
      }

      // если всё ок — летим в дашборд
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1 className="admin-login-title">
          {mode === "setup" ? "Set up admin access" : "Admin login"}
        </h1>
        <p className="admin-login-subtitle">
          {mode === "setup"
            ? "Create the first administrator account. The password hash will be stored in config on the server."
            : "Log in to manage projects, portfolio and publications."}
        </p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-login-field">
            <span>Admin name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {mode === "setup" && (
            <label className="admin-login-field">
              <span>Repeat password</span>
              <input
                type="password"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                required
              />
            </label>
          )}

          {error && <div className="admin-login-error">{error}</div>}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "setup"
              ? "Create admin"
              : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

