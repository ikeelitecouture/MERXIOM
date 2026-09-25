import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

function money(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const token = localStorage.getItem("merxiom_token");

        if (!token) {
          throw new Error("Please sign in as the MERXIOM owner.");
        }

        const response = await fetch(`${API}/orders/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load admin statistics");
        }

        setStats(data.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <div className="admin-page">Loading MERXIOM Owner Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <h2>MERXIOM Owner Access</h2>
          <p>{error}</p>
          <a href="/login">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">MERXIOM OWNER</p>
          <h1>Command Center</h1>
          <p>Monitor the marketplace, orders and MERXIOM revenue.</p>
        </div>

        <a href="/" className="admin-market-link">
          View Marketplace
        </a>
      </header>

      <section className="admin-grid">
        <div className="admin-card">
          <span>Total Users</span>
          <strong>{stats.totalUsers}</strong>
        </div>

        <div className="admin-card">
          <span>Customers</span>
          <strong>{stats.customers}</strong>
        </div>

        <div className="admin-card">
          <span>Sellers</span>
          <strong>{stats.sellers}</strong>
        </div>

        <div className="admin-card">
          <span>Businesses</span>
          <strong>{stats.businesses}</strong>
        </div>

        <div className="admin-card">
          <span>Total Orders</span>
          <strong>{stats.totalOrders}</strong>
        </div>

        <div className="admin-card">
          <span>Paid Orders</span>
          <strong>{stats.paidOrders}</strong>
        </div>

        <div className="admin-card admin-card-wide">
          <span>Marketplace GMV</span>
          <strong>{money(stats.gmv)}</strong>
        </div>

        <div className="admin-card admin-card-highlight">
          <span>MERXIOM Platform Revenue</span>
          <strong>{money(stats.platformRevenue)}</strong>
          <small>7.5% platform commission</small>
        </div>

        <div className="admin-card">
          <span>Seller Earnings</span>
          <strong>{money(stats.sellerEarnings)}</strong>
        </div>

        <div className="admin-card">
          <span>Shipping Collected</span>
          <strong>{money(stats.shippingCollected)}</strong>
        </div>
      </section>
    </div>
  );
}
