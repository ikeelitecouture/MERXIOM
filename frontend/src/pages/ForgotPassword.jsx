import { useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to process request."
        );
      }

      setMessage(
        "If an MERXIOM account exists with that email, a password reset link will be sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong."
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

        <h1>
          Forgot your password?
        </h1>

        <p className="auth-intro">
          Enter the email connected to your
          MERXIOM account and we'll help you
          regain access.
        </p>

        <form onSubmit={submit}>

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </label>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          {error && (
            <div className="auth-message">
              {error}
            </div>
          )}

          <button
            className="dashboard-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : "Send reset link →"}
          </button>

        </form>

        <div className="auth-switch">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() =>
              (window.location.href =
                "/login")
            }
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}
