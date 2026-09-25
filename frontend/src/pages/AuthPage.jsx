import { useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        mode === "login"
          ? `${API}/auth/login`
          : `${API}/auth/register`;

      const body =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      localStorage.setItem(
        "merxiom_token",
        data.token
      );

      localStorage.setItem(
        "merxiom_user",
        JSON.stringify(data.user)
      );

      const redirect =
        new URLSearchParams(
          window.location.search
        ).get("redirect");

      if (redirect) {
        window.location.href = redirect;
      } else if (data.user?.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user?.role === "seller") {
        window.location.href = "/business";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(
      mode === "login"
        ? "register"
        : "login"
    );
    setMessage("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-mark">A</span>
          <span>MERXIOM</span>
        </div>

        <p className="eyebrow">
          {mode === "login"
            ? "WELCOME BACK"
            : "JOIN MERXIOM"}
        </p>

        <h1>
          {mode === "login"
            ? "Sign in to MERXIOM."
            : "Create your MERXIOM account."}
        </h1>

        <p className="auth-intro">
          {mode === "login"
            ? "Sign in and we'll take you to the right place for your account."
            : "Choose how you'll use MERXIOM. You can shop or build your business."}
        </p>

        {mode === "register" && (
          <div className="role-selector">

            <button
              type="button"
              className={
                role === "customer"
                  ? "role-option active"
                  : "role-option"
              }
              onClick={() =>
                setRole("customer")
              }
            >
              <span className="role-icon">
                🛍️
              </span>

              <span>
                <strong>Shop on MERXIOM</strong>
                <small>
                  Discover products and place orders.
                </small>
              </span>
            </button>

            <button
              type="button"
              className={
                role === "seller"
                  ? "role-option active"
                  : "role-option"
              }
              onClick={() =>
                setRole("seller")
              }
            >
              <span className="role-icon">
                🏪
              </span>

              <span>
                <strong>Sell on MERXIOM</strong>
                <small>
                  Create a store and sell products.
                </small>
              </span>
            </button>

          </div>
        )}

        <form onSubmit={submit}>

          {mode === "register" && (
            <label>
              Full name

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="••••••••"
              minLength="6"
              required
            />
          </label>

          {mode === "login" && (
            <div className="forgot-password-link">
              <button
                type="button"
                onClick={() =>
                  (window.location.href =
                    "/forgot-password")
                }
              >
                Forgot password?
              </button>
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
              ? "Please wait..."
              : mode === "login"
              ? "Sign in →"
              : role === "seller"
              ? "Create seller account →"
              : "Create customer account →"}
          </button>

        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an MERXIOM account?{" "}
              <button
                type="button"
                onClick={switchMode}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
              >
                Sign in
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
