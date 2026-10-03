import { useState } from "react";
import "../App.css";

function getUser() {
  try {
    const saved = localStorage.getItem("merxiom_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const user = getUser();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const logout = () => {
    localStorage.removeItem("merxiom_token");
    localStorage.removeItem("merxiom_user");
    window.location.href = "/";
  };

  return (
    <div className="merxiom-settings-page">
      <main className="merxiom-settings-main">
        <div className="merxiom-settings-heading">
          <div>
            <p className="eyebrow">MERXIOM ACCOUNT</p>
            <h1>Settings</h1>
            <p>
              Manage your account, security, notifications and shopping
              preferences.
            </p>
          </div>

          <a href="/account" className="back-link">
            ← Back to account
          </a>
        </div>

        <div className="merxiom-settings-layout">
          <aside className="merxiom-settings-nav">
            <a href="#profile" className="active">Profile</a>
            <a href="#security">Security</a>
            <a href="#notifications">Notifications</a>
            <a href="#preferences">Shopping preferences</a>
            <a href="#privacy">Privacy</a>
          </aside>

          <div className="merxiom-settings-content">

            <section id="profile" className="merxiom-settings-card">
              <div className="merxiom-settings-card-heading">
                <div>
                  <p className="eyebrow">PROFILE</p>
                  <h2>Account information</h2>
                </div>
              </div>

              <div className="merxiom-settings-profile">
                <div className="merxiom-settings-avatar">
                  {(user.name || "A").charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>
                    {user.role === "seller"
                      ? "Seller account"
                      : user.role === "admin"
                      ? "MERXIOM Owner"
                      : "Customer account"}
                  </small>
                </div>
              </div>

              <div className="merxiom-settings-info-grid">
                <div>
                  <span>Name</span>
                  <strong>{user.name || "—"}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{user.email || "—"}</strong>
                </div>
              </div>
            </section>

            <section id="security" className="merxiom-settings-card">
              <div className="merxiom-settings-card-heading">
                <div>
                  <p className="eyebrow">SECURITY</p>
                  <h2>Password & security</h2>
                </div>
              </div>

              <div className="merxiom-settings-row">
                <div>
                  <strong>Password</strong>
                  <span>Keep your MERXIOM account protected.</span>
                </div>

                <a href="/forgot-password" className="settings-action">
                  Change password →
                </a>
              </div>
            </section>

            <section id="notifications" className="merxiom-settings-card">
              <div className="merxiom-settings-card-heading">
                <div>
                  <p className="eyebrow">NOTIFICATIONS</p>
                  <h2>Stay updated</h2>
                </div>
              </div>

              <label className="merxiom-settings-toggle-row">
                <div>
                  <strong>Order updates</strong>
                  <span>Receive updates about your purchases and deliveries.</span>
                </div>

                <input
                  type="checkbox"
                  checked={orderUpdates}
                  onChange={(event) => setOrderUpdates(event.target.checked)}
                />
              </label>

              <label className="merxiom-settings-toggle-row">
                <div>
                  <strong>MERXIOM updates</strong>
                  <span>Receive useful marketplace and account updates.</span>
                </div>

                <input
                  type="checkbox"
                  checked={emailUpdates}
                  onChange={(event) => setEmailUpdates(event.target.checked)}
                />
              </label>
            </section>

            <section id="preferences" className="merxiom-settings-card">
              <div className="merxiom-settings-card-heading">
                <div>
                  <p className="eyebrow">PREFERENCES</p>
                  <h2>Shopping preferences</h2>
                </div>
              </div>

              <div className="merxiom-settings-row">
                <div>
                  <strong>Delivery addresses</strong>
                  <span>Manage the places where you receive orders.</span>
                </div>

                <a href="/account#addresses" className="settings-action">
                  Manage addresses →
                </a>
              </div>

              <div className="merxiom-settings-row">
                <div>
                  <strong>Appearance</strong>
                  <span>Choose how MERXIOM looks on your device.</span>
                </div>

                <label className="merxiom-settings-inline-toggle">
                  <span>Dark mode</span>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(event) => setDarkMode(event.target.checked)}
                  />
                </label>
              </div>
            </section>

            <section id="privacy" className="merxiom-settings-card">
              <div className="merxiom-settings-card-heading">
                <div>
                  <p className="eyebrow">PRIVACY</p>
                  <h2>Privacy & account</h2>
                </div>
              </div>

              <div className="merxiom-settings-row">
                <div>
                  <strong>Account data</strong>
                  <span>
                    Your account information is used to provide MERXIOM
                    services.
                  </span>
                </div>
              </div>

              <div className="merxiom-settings-danger">
                <div>
                  <strong>Sign out of MERXIOM</strong>
                  <span>End your current session on this device.</span>
                </div>

                <button type="button" onClick={logout}>
                  Sign out
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
