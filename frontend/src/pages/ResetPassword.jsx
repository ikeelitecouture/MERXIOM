import { useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("This password reset link is invalid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to reset password."
        );
      }

      setMessage(
        "Password reset successfully. You can now sign in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-mark">A</span>
          <span>MERXIOM</span>
        </div>

        <p className="eyebrow">
          ACCOUNT RECOVERY
        </p>

        <h1>Set a new password.</h1>

        <p className="auth-intro">
          Choose a new password for your MERXIOM
          account.
        </p>

        <form onSubmit={submit}>

          <label>
            New password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              minLength="6"
              required
            />
          </label>

          <label>
            Confirm password

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="••••••••"
              minLength="6"
              required
            />
          </label>

          {error && (
            <div className="auth-message">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <button
            className="dashboard-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password →"}
          </button>

        </form>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/login")
            }
          >
            ← Back to sign in
          </button>
        </div>

      </div>
    </div>
  );
}
