import { useEffect, useMemo, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";
import "./UsersPage.scss";

type UserItem = {
  login: string;
  role: "admin" | "moderator" | "observer";
  hasPassword: boolean;
  inviteUrl?: string | null;
};

type StateUser = { name: string; role: string };

const roleOptions: Array<{ value: UserItem["role"]; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "observer", label: "Observer" },
];

export default function UsersPage() {
  const ready = useRequireAdminAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StateUser | null>(null);
  const [newUser, setNewUser] = useState<{ login: string; role: UserItem["role"] }>({ login: "", role: "observer" });

  const isAdmin = useMemo(() => currentUser?.role === "admin", [currentUser]);

  useEffect(() => {
    if (!ready) return;
    const fetchState = async () => {
      try {
        const resp = await fetch("/api/admin/auth/state", { credentials: "include" });
        const data = await resp.json();
        if (data?.user) {
          setCurrentUser({ name: data.user.name, role: data.user.role });
        }
      } catch {
        // ignore
      }
    };
    fetchState();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    loadUsers();
  }, [ready]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin/users/list", { credentials: "include" });
      if (resp.status === 403) {
        setError("You do not have permission to manage users.");
        return;
      }
      const data = await resp.json();
      if (!data.success) {
        setError(data.error ?? "Failed to load users");
        return;
      }
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (login: string, role: UserItem["role"], generateInvite = false) => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const resp = await fetch("/api/admin/users/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, role, generateInvite }),
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save user");
        return;
      }
      if (data.inviteLink) {
        setInfo(`Invite link for ${login}: ${data.inviteLink}`);
      } else {
        setInfo("Saved");
      }
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (login: string) => {
    if (!window.confirm(`Delete user ${login}?`)) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const resp = await fetch("/api/admin/users/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login }),
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data.error ?? "Failed to delete user");
        return;
      }
      setInfo("User deleted");
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  if (!isAdmin) {
    return (
      <div className="users-page">
        <div className="alert alert--error">
          <div className="alert__title">Error!</div>
          <div className="alert__text">You do not have permission to manage users.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h1>Users</h1>
          <p>Manage admin accounts and roles. Admins can add users and change roles. Observers are read-only.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          <div className="alert__title">Error!</div>
          <div className="alert__text">{error}</div>
        </div>
      )}
      {info && (
        <div className="alert alert--info">
          <div className="alert__title">Info</div>
          <div className="alert__text">{info}</div>
        </div>
      )}

      <div className="users-card">
        <div className="users-card__header">Existing users</div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Login</th>
                <th>Role</th>
                <th>Status</th>
                <th>Invite</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.login}>
                  <td>{u.login}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleSave(u.login, e.target.value as UserItem["role"])}
                      disabled={saving}
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{u.hasPassword ? "Active" : "Pending password"}</td>
                  <td className="users-table__invite">
                    {u.inviteUrl ? (
                      <a href={u.inviteUrl} target="_blank" rel="noreferrer">
                        Invite link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="users-table__actions">
                    <button onClick={() => handleSave(u.login, u.role, true)} disabled={saving}>
                      Regenerate link
                    </button>
                    <button onClick={() => handleDelete(u.login)} disabled={saving}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="users-card">
        <div className="users-card__header">Add user</div>
        <div className="users-form">
          <label>
            Login
            <input
              value={newUser.login}
              onChange={(e) => setNewUser((prev) => ({ ...prev, login: e.target.value }))}
              placeholder="username"
            />
          </label>
          <label>
            Role
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserItem["role"] }))}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={saving || newUser.login.trim() === ""}
            onClick={() => {
              void handleSave(newUser.login.trim(), newUser.role, true);
              setNewUser({ login: "", role: "observer" });
            }}
          >
            Create invite link
          </button>
        </div>
      </div>
    </div>
  );
}
