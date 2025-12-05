import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./SetPasswordPage.scss";

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLogin(null);
    if (!token) {
      setError("Invalid link");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/auth/set_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data.error ?? "Failed to set password");
      } else {
        setLogin(data.login ?? null);
        setSuccess("Password set. You can now log in.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setpw">
      <div className="setpw__card">
        <h1>Set your password</h1>
        <p>Enter a new password to activate your account.</p>

        {error && (
          <div className="alert alert--error">
            <div className="alert__title">Error!</div>
            <div className="alert__text">{error}</div>
          </div>
        )}
        {success && (
          <div className="alert alert--info">
            <div className="alert__title">Success</div>
            <div className="alert__text">
              {login ? <>Password set for <strong>{login}</strong>. </> : null}
              {success}{" "}
              <a href="/admin">Log in</a>
            </div>
          </div>
        )}

        <label className="setpw__field">
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </label>
        <label className="setpw__field">
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
          />
        </label>

        <button onClick={handleSubmit} disabled={loading || !token}>
          {loading ? "Saving..." : "Set password"}
        </button>
      </div>
    </div>
  );
}
