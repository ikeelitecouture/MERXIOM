import { useEffect, useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

function AccountMobileBottomNav() {
  let cartCount = 0;

  try {
    const cart = JSON.parse(
      localStorage.getItem("merxiom_cart") || "[]"
    );
    cartCount = cart.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  } catch {
    cartCount = 0;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <a href="/" className="mobile-bottom-nav-item">
        <span className="mobile-bottom-nav-icon">⌂</span>
        <span>Home</span>
      </a>

      <a href="/discover" className="mobile-bottom-nav-item">
        <span className="mobile-bottom-nav-icon">☰</span>
        <span>Categories</span>
      </a>

      <a href="/ai" className="mobile-bottom-nav-item mobile-bottom-nav-ai">
        <span className="mobile-bottom-nav-icon">✦</span>
        <span>AI</span>
      </a>

      <a href="/cart" className="mobile-bottom-nav-item mobile-bottom-nav-cart">
        <span className="mobile-bottom-nav-icon">🛒</span>
        <span>Cart</span>
        {cartCount > 0 && (
          <span className="mobile-bottom-nav-count">
            {cartCount}
          </span>
        )}
      </a>

      <a href="/account" className="mobile-bottom-nav-item">
        <span className="mobile-bottom-nav-icon">◯</span>
        <span>Account</span>
      </a>
    </nav>
  );
}

function getUser() {
  try {
    const saved = localStorage.getItem("merxiom_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function AccountPage() {
  const user = getUser();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressesError, setAddressesError] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    isDefault: false
  });

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem("merxiom_token");

      if (!token) {
        setLoadingOrders(false);
        return;
      }

      try {
        const response = await fetch(`${API}/orders/mine`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load orders"
          );
        }

        setOrders(data.orders || []);
      } catch (error) {
        setOrdersError(error.message);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const loadAddresses = async () => {
      const token = localStorage.getItem("merxiom_token");

      if (!token) {
        setLoadingAddresses(false);
        return;
      }

      try {
        const response = await fetch(`${API}/auth/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load saved addresses"
          );
        }

        setAddresses(data.addresses || []);
      } catch (error) {
        setAddressesError(error.message);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, []);

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const roleLabel =
    user.role === "admin"
      ? "MERXIOM Owner"
      : user.role === "seller"
      ? "Seller"
      : "Customer";

  const dashboard =
    user.role === "admin"
      ? "/admin"
      : user.role === "seller"
      ? "/business"
      : "/";

  const dashboardText =
    user.role === "admin"
      ? "Open Owner Dashboard →"
      : user.role === "seller"
      ? "Open Business Dashboard →"
      : "Continue Shopping →";

  const saveAddress = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("merxiom_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSavingAddress(true);
    setAddressFormError("");

    try {
      const response = await fetch(`${API}/auth/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save address"
        );
      }

      setAddresses((current) => [
        ...current,
        data.address
      ]);

      setAddressForm({
        label: "Home",
        fullName: user?.name || "",
        phone: "",
        address: "",
        city: "",
        state: "",
        isDefault: false
      });

      setShowAddressForm(false);
    } catch (error) {
      setAddressFormError(error.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("merxiom_token");
    localStorage.removeItem("merxiom_user");
    window.location.href = "/";
  };

  return (
    <div className="account-page">
      <div className="account-search-wrap">
        <div className="account-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            type="search"
            placeholder="Search MERXIOM"
            aria-label="Search MERXIOM"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const value = event.currentTarget.value.trim();
                if (value) {
                  window.location.href = `/discover?search=${encodeURIComponent(value)}`;
                }
              }
            }}
          />
        </div>
      </div>

      <main className="account-shell">
        <section className="account-welcome-card">
          <div className="account-welcome-main">
            <div className="account-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="account-eyebrow">MY MERXIOM</p>
              <h1>Welcome back, {user.name || "there"}</h1>
              <p className="account-email">{user.email || "Your MERXIOM account"}</p>
              <span className="account-role-badge">{roleLabel}</span>
            </div>
          </div>

          <div className="account-welcome-actions">
            <a href={dashboard} className="account-primary-action">
              {dashboardText}
            </a>
            <button type="button" onClick={logout} className="account-logout-action">
              Sign out
            </button>
          </div>
        </section>

        <section className="account-support-grid">
          <a href="/ai" className="account-support-card">
            <span className="account-menu-icon account-ai-icon">✦</span>
            <span>
              <strong>MERXIOM AI</strong>
              <small>Get shopping & business help</small>
            </span>
            <span className="account-arrow">→</span>
          </a>

          <a
            href="https://wa.me/234"
            target="_blank"
            rel="noreferrer"
            className="account-support-card"
          >
            <span className="account-menu-icon">◌</span>
            <span>
              <strong>WhatsApp Support</strong>
              <small>Chat with MERXIOM support</small>
            </span>
            <span className="account-arrow">→</span>
          </a>
        </section>

        <section className="account-menu-section">
          <div className="account-section-heading">
            <p>NEED ASSISTANCE</p>
            <h2>How can we help?</h2>
          </div>

          <div className="account-menu-list">
            <a href="/help" className="account-menu-item">
              <span className="account-menu-icon">?</span>
              <span>
                <strong>Help & Support</strong>
                <small>FAQs, account and marketplace support</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">⌕</span>
              <span>
                <strong>Discover Products</strong>
                <small>Explore products and stores on MERXIOM</small>
              </span>
              <span className="account-arrow">›</span>
            </a>
          </div>
        </section>

        <section className="account-menu-section">
          <div className="account-section-heading">
            <p>MY MERXIOM</p>
            <h2>Shopping & activity</h2>
          </div>

          <div className="account-menu-list">
            <a href="#orders" className="account-menu-item">
              <span className="account-menu-icon">▣</span>
              <span>
                <strong>Orders</strong>
                <small>{orders.length} order{orders.length === 1 ? "" : "s"} in your account</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/help" className="account-menu-item">
              <span className="account-menu-icon">✉</span>
              <span>
                <strong>Messages & Inbox</strong>
                <small>Keep up with your MERXIOM conversations</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">♡</span>
              <span>
                <strong>Wishlist</strong>
                <small>Save products you want to revisit</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">☆</span>
              <span>
                <strong>Ratings & Reviews</strong>
                <small>Share your experience with products</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">◇</span>
              <span>
                <strong>Vouchers & Offers</strong>
                <small>View available marketplace savings</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">⌂</span>
              <span>
                <strong>Followed Stores</strong>
                <small>Find businesses you follow</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/discover" className="account-menu-item">
              <span className="account-menu-icon">◷</span>
              <span>
                <strong>Recently Viewed</strong>
                <small>Return to products you've explored</small>
              </span>
              <span className="account-arrow">›</span>
            </a>
          </div>
        </section>

        <section className="account-menu-section">
          <div className="account-section-heading">
            <p>MY SETTINGS</p>
            <h2>Account preferences</h2>
          </div>

          <div className="account-menu-list">
            <a href="#addresses" className="account-menu-item">
              <span className="account-menu-icon">⌖</span>
              <span>
                <strong>Address Book</strong>
                <small>{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/account" className="account-menu-item">
              <span className="account-menu-icon">◉</span>
              <span>
                <strong>Notification Preferences</strong>
                <small>Manage how MERXIOM keeps you informed</small>
              </span>
              <span className="account-arrow">›</span>
            </a>

            <a href="/account" className="account-menu-item">
              <span className="account-menu-icon">⚙</span>
              <span>
                <strong>Account Settings</strong>
                <small>Review your profile and account details</small>
              </span>
              <span className="account-arrow">›</span>
            </a>
          </div>
        </section>

        <section id="orders" className="account-data-section">
          <div className="account-data-heading">
            <div>
              <p>YOUR ACTIVITY</p>
              <h2>Orders & Delivery</h2>
            </div>
            <span>{orders.length}</span>
          </div>

          {loadingOrders ? (
            <div className="account-state">Loading your orders…</div>
          ) : ordersError ? (
            <div className="account-state account-state-error">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="account-empty-state">
              <strong>No orders yet</strong>
              <p>Your purchases will appear here once you place an order.</p>
              <a href="/discover">Start shopping →</a>
            </div>
          ) : (
            <div className="account-orders-list">
              {orders.map((order) => (
                <article key={order._id || order.id} className="account-order-card">
                  <div className="account-order-top">
                    <div>
                      <strong>Order #{order._id?.slice(-8) || order.id || "—"}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>
                    <span className="account-order-status">
                      {order.status || "Processing"}
                    </span>
                  </div>

                  <div className="account-order-meta">
                    <span>{order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}</span>
                    <strong>{formatMoney(order.total || order.amount)}</strong>
                  </div>

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="account-track-link"
                    >
                      Track delivery →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="addresses" className="account-data-section">
          <div className="account-data-heading">
            <div>
              <p>DELIVERY</p>
              <h2>Saved Addresses</h2>
            </div>
            <button
              type="button"
              className="account-add-address"
              onClick={() => setShowAddressForm((value) => !value)}
            >
              {showAddressForm ? "Close" : "+ Add"}
            </button>
          </div>

          {showAddressForm && (
            <form className="account-address-form" onSubmit={saveAddress}>
              <input
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="Label"
              />
              <input
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                placeholder="Full name"
              />
              <input
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                placeholder="Phone number"
                type="tel"
              />
              <input
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                placeholder="Street address"
              />
              <input
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="City"
              />
              <input
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                placeholder="State"
              />

              <label className="account-default-toggle">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                <span>Make this my default address</span>
              </label>

              {addressFormError && (
                <p className="account-form-error">{addressFormError}</p>
              )}

              <button type="submit" disabled={savingAddress} className="account-save-address">
                {savingAddress ? "Saving…" : "Save address"}
              </button>
            </form>
          )}

          {loadingAddresses ? (
            <div className="account-state">Loading your addresses…</div>
          ) : addressesError ? (
            <div className="account-state account-state-error">{addressesError}</div>
          ) : addresses.length === 0 ? (
            <div className="account-empty-state">
              <strong>No saved addresses</strong>
              <p>Add an address so checkout can be faster next time.</p>
            </div>
          ) : (
            <div className="account-address-list">
              {addresses.map((address) => (
                <article key={address._id || address.id} className="account-address-card">
                  <div className="account-address-card-top">
                    <strong>{address.label || "Address"}</strong>
                    {address.isDefault && <span>Default</span>}
                  </div>
                  <p>{address.fullName}</p>
                  <p>{address.phone}</p>
                  <p>{address.address}</p>
                  <p>{address.city}, {address.state}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="account-marketplace-link">
          <a href="/">← Back to MERXIOM marketplace</a>
        </div>
      </main>

      <AccountMobileBottomNav />
    </div>
  )
}
