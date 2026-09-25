import { useEffect, useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

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

  const logout = () => {
    localStorage.removeItem("merxiom_token");
    localStorage.removeItem("merxiom_user");
    window.location.href = "/";
  };

  return (
    <div className="account-page">
      <div className="account-card">

        <div className="account-avatar">
          {(user.name || "A").charAt(0).toUpperCase()}
        </div>

        <p className="eyebrow">MY MERXIOM ACCOUNT</p>

        <h1>{user.name}</h1>

        <p className="account-role">{roleLabel}</p>

        <div className="account-details">
          <div>
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div>
            <span>Account type</span>
            <strong>{roleLabel}</strong>
          </div>
        </div>

        <div className="account-actions">
          <a href={dashboard} className="dashboard-primary">
            {dashboardText}
          </a>

          <button
            type="button"
            className="account-logout"
            onClick={logout}
          >
            Sign out
          </button>
        </div>

        {user.role === "customer" && (
          <section className="account-orders">

            <div className="account-orders-heading">
              <div>
                <p className="eyebrow">MY MERXIOM ORDERS</p>
                <h2>Orders & Delivery</h2>
              </div>

              <span className="account-order-count">
                {orders.length}
              </span>
            </div>

            {loadingOrders && (
              <div className="account-orders-empty">
                Loading your orders…
              </div>
            )}

            {!loadingOrders && ordersError && (
              <div className="account-orders-empty">
                {ordersError}
              </div>
            )}

            {!loadingOrders &&
              !ordersError &&
              orders.length === 0 && (
                <div className="account-orders-empty">
                  <strong>No orders yet.</strong>
                  <span>
                    Your MERXIOM purchases will appear here.
                  </span>
                </div>
              )}

            {!loadingOrders &&
              !ordersError &&
              orders.length > 0 && (
                <div className="account-orders-list">
                  {orders.map((order) => (
                    <article
                      className="account-order"
                      key={order._id}
                    >

                      <div className="account-order-top">
                        <div>
                          <span className="account-order-ref">
                            {order.orderReference}
                          </span>

                          <small>
                            {formatDate(order.createdAt)}
                          </small>
                        </div>

                        <span
                          className={`account-status account-status-${String(
                            order.orderStatus || "pending"
                          ).toLowerCase()}`}
                        >
                          {order.orderStatus || "pending"}
                        </span>
                      </div>

                      <div className="account-order-products">
                        {(order.items || []).map(
                          (item, index) => (
                            <div
                              className="account-order-product"
                              key={`${item.product?._id || "item"}-${index}`}
                            >
                              {item.product?.images?.[0] ? (
                                <img
                                  src={
                                    item.product.images[0].startsWith(
                                      "http"
                                    )
                                      ? item.product.images[0]
                                      : `${API.replace("/api", "")}${item.product.images[0]}`
                                  }
                                  alt={item.name || "Product"}
                                />
                              ) : (
                                <div className="account-order-product-placeholder">
                                  MERXIOM
                                </div>
                              )}

                              <div>
                                <strong>
                                  {item.name}
                                </strong>

                                <span>
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="account-order-meta">
                        <div>
                          <span>Payment</span>
                          <strong>
                            {order.paymentStatus || "pending"}
                          </strong>
                        </div>

                        <div>
                          <span>Total</span>
                          <strong>
                            {formatMoney(order.total)}
                          </strong>
                        </div>

                        <div>
                          <span>Courier</span>
                          <strong>
                            {order.courier?.name || "—"}
                          </strong>
                        </div>
                      </div>

                      {order.shipbubble?.orderId && (
                        <div className="account-tracking">
                          <div>
                            <span>Shipment</span>
                            <strong>
                              {order.shipbubble.orderId}
                            </strong>
                          </div>

                          {order.shipbubble.trackingUrl && (
                            <a
                              href={order.shipbubble.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Track shipment →
                            </a>
                          )}
                        </div>
                      )}

                    </article>
                  ))}
                </div>
              )}

          </section>
        )}

        <a href="/" className="account-home">
          ← Back to Marketplace
        </a>

      </div>
    </div>
  );
}
