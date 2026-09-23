import { useEffect, useState } from "react";
import "../App.css";

const API = import.meta.env.VITE_API_URL;

function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [shippingForm, setShippingForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const [shippingSaving, setShippingSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    status: "active",
    images: [],
  });

  const token = localStorage.getItem("axiom_token");

  const menu = [
    "Overview",
    "Products",
    "Orders",
    "Customers",
    "Analytics",
    "Store Settings",
  ];

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingOrder(orderId);
      setOrdersError("");

      const token = localStorage.getItem("axiom_token");

      const response = await fetch(
        `${API}/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update order status."
        );
      }

      setSellerOrders((current) =>
        current.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: status }
            : order
        )
      );
    } catch (error) {
      console.error("Order status update error:", error);
      setOrdersError(
        error.message || "Failed to update order status."
      );
    } finally {
      setUpdatingOrder("");
    }
  };

  const loadDashboard = async () => {
    if (!token) {
      setMessage("Please log in to your AXIOM business account.");
      setLoading(false);
      return;
    }

    try {
      const businessResponse = await fetch(
        `${API}/businesses/mine`,
        { headers }
      );

      const businessData = await businessResponse.json();

      if (!businessResponse.ok || !businessData.success) {
        throw new Error(
          businessData.message || "Unable to load your store."
        );
      }

      const currentBusiness = businessData.businesses?.[0];

      if (!currentBusiness) {
        setMessage("You don't have an AXIOM store yet.");
        setLoading(false);
        return;
      }

      setBusiness(currentBusiness);

      setShippingForm({
        name: currentBusiness.name || "",
        email: "",
        phone: currentBusiness.shipping?.phone || "",
        address: currentBusiness.shipping?.pickupAddress || "",
        city: currentBusiness.shipping?.city || "",
        state: currentBusiness.shipping?.state || "",
      });

      const productResponse = await fetch(
        `${API}/products/mine`,
        { headers }
      );

      const productData = await productResponse.json();

      if (productResponse.ok && productData.success) {
        setProducts(productData.products || []);
      }

      setOrdersLoading(true);
      setOrdersError("");

      try {
        const ordersResponse = await fetch(
          `${API}/orders/seller`,
          { headers }
        );

        const ordersData = await ordersResponse.json();

        if (!ordersResponse.ok || !ordersData.success) {
          throw new Error(
            ordersData.message || "Unable to load seller orders."
          );
        }

        setSellerOrders(ordersData.orders || []);
      } catch (error) {
        console.error("Seller orders error:", error);
        setOrdersError(
          error.message || "Failed to load seller orders."
        );
      } finally {
        setOrdersLoading(false);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeProducts = products.filter(
    (product) => product.status === "active"
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const openAddForm = () => {
    setEditingProduct(null);

    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      status: "active",
    });

    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category: product.category || "",
      stock: product.stock ?? "",
      status: product.status || "active",
    });

    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (!saving) {
      setShowForm(false);
      setEditingProduct(null);
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 5);

    if (!files.length) return;

    setForm((previous) => ({
      ...previous,
      images: files,
    }));

    event.target.value = "";
  };

  const removeImage = (index) => {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    if (!business) return;

    setSaving(true);
    setMessage("");

    try {
      const price = Number(form.price);
      const stock = Number(form.stock || 0);

      if (
        !form.name.trim() ||
        !form.category.trim() ||
        Number.isNaN(price) ||
        price < 0
      ) {
        throw new Error(
          "Please enter a valid product name, price and category."
        );
      }

      const formData = new FormData();

      formData.append("businessId", business._id);
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("price", price);
      formData.append("category", form.category.trim());
      formData.append("stock", stock);
      formData.append("status", form.status);

      if (form.images && form.images.length > 0) {
        form.images.slice(0, 5).forEach((image) => {
          if (image instanceof File) {
            formData.append("images", image);
          }
        });
      }

      const endpoint = editingProduct
        ? `${API}/products/${editingProduct._id}`
        : `${API}/products`;

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save product."
        );
      }

      setShowForm(false);
      setEditingProduct(null);

      await loadDashboard();

      setMessage(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}" from your store?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/products/${product._id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete product."
        );
      }

      setProducts((previous) =>
        previous.filter((item) => item._id !== product._id)
      );

      setMessage("Product deleted successfully.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to delete product.");
    }
  };

  if (loading) {
    return (
      <div className="business-dashboard">
        <main className="dashboard-main">
          <div className="dashboard-placeholder">
            <p className="eyebrow">AXIOM BUSINESS</p>
            <h2>Loading your store...</h2>
            <p>Connecting to your AXIOM account.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!token || !business) {
    return (
      <div className="business-dashboard">
        <main className="dashboard-main">
          <div className="dashboard-placeholder">
            <p className="eyebrow">AXIOM BUSINESS</p>
            <h2>{message || "Business account required"}</h2>
            <p>
              Log in to your AXIOM seller account to access your dashboard.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="business-dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">A</span>
          <span>AXIOM</span>
        </div>

        <a
          href="/"
          className="dashboard-home-link"
        >
          ← Back to Home
        </a>

        <p className="dashboard-label">BUSINESS</p>

        <nav>
          {menu.map((item) => (
            <button
              key={item}
              className={
                activeTab === item
                  ? "dashboard-nav active"
                  : "dashboard-nav"
              }
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-store">
          <span>STORE</span>
          <strong>{business.name}</strong>
          <small>{business.slug}</small>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">BUSINESS DASHBOARD</p>
            <h1>{activeTab}</h1>
          </div>

          <button className="dashboard-profile">
            <span>
              {business.name?.slice(0, 2).toUpperCase()}
            </span>
            {business.name}
          </button>
        </header>

        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}

        {activeTab === "Overview" && (
          <>
            <section className="welcome-card">
              <div>
                <p className="eyebrow">
                  WELCOME TO AXIOM BUSINESS
                </p>

                <h2>Grow your business from one place.</h2>

                <p>
                  Manage your products, orders and customers while
                  reaching more people through AXIOM Market.
                </p>
              </div>

              <button
                className="dashboard-primary"
                onClick={() => setActiveTab("Products")}
              >
                Manage products →
              </button>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <span>PRODUCTS</span>
                <strong>{products.length}</strong>
                <small>Total products</small>
              </article>

              <article className="stat-card">
                <span>ACTIVE</span>
                <strong>{activeProducts.length}</strong>
                <small>Products live on AXIOM</small>
              </article>

              <article className="stat-card">
                <span>ORDERS</span>
                <strong>0</strong>
                <small>Total orders</small>
              </article>

              <article className="stat-card">
                <span>REVENUE</span>
                <strong>₦0</strong>
                <small>Total sales</small>
              </article>
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR STORE</p>
                  <h2>{business.name}</h2>
                </div>

                <button
                  className="dashboard-primary"
                  onClick={openAddForm}
                >
                  + Add product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="empty-dashboard">
                  <div className="empty-icon">A</div>

                  <h3>Your AXIOM store is ready.</h3>

                  <p>
                    Add your first product and start building your
                    online business.
                  </p>

                  <button
                    className="dashboard-primary"
                    onClick={openAddForm}
                  >
                    Add product
                  </button>
                </div>
              ) : (
                <div className="product-preview-list">
                  {products.slice(0, 5).map((product) => (
                    <div
                      className="dashboard-product-row"
                      key={product._id}
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.category}</small>
                      </div>

                      <strong>{formatPrice(product.price)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "Products" && (
          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CATALOG</p>
                <h2>Your products</h2>
              </div>

              <button
                className="dashboard-primary"
                onClick={openAddForm}
              >
                + Add product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="empty-dashboard">
                <div className="empty-icon">A</div>

                <h3>No products yet.</h3>

                <p>
                  Add products to start selling through AXIOM Market.
                </p>

                <button
                  className="dashboard-primary"
                  onClick={openAddForm}
                >
                  Add product
                </button>
              </div>
            ) : (
              <div className="product-management-list">
                {products.map((product) => (
                  <div
                    className="product-management-card"
                    key={product._id}
                  >
                    <div className="product-management-info">
                      <div className="product-avatar">
                        {product.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{product.name}</strong>

                        <small>
                          {product.category} · Stock: {product.stock}
                        </small>

                        <span
                          className={`product-status ${product.status}`}
                        >
                          {product.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="product-management-actions">
                      <strong>
                        {formatPrice(product.price)}
                      </strong>

                      <button
                        className="product-edit-button"
                        onClick={() => openEditForm(product)}
                      >
                        Edit
                      </button>

                      <button
                        className="product-delete-button"
                        onClick={() => deleteProduct(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "Orders" && (
          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SELLER ORDERS</p>
                <h2>Customer orders</h2>
                <p>
                  Manage orders placed for products in your AXIOM store.
                </p>
              </div>

              <span className="account-order-count">
                {sellerOrders.length}
              </span>
            </div>

            {ordersLoading && (
              <div className="empty-dashboard">
                <h3>Loading orders...</h3>
                <p>Checking your latest AXIOM orders.</p>
              </div>
            )}

            {!ordersLoading && ordersError && (
              <div className="empty-dashboard">
                <h3>Unable to load orders</h3>
                <p>{ordersError}</p>
              </div>
            )}

            {!ordersLoading &&
              !ordersError &&
              sellerOrders.length === 0 && (
                <div className="empty-dashboard">
                  <div className="empty-icon">A</div>

                  <h3>No orders yet.</h3>

                  <p>
                    Customer purchases for your products will appear here.
                  </p>
                </div>
              )}

            {!ordersLoading &&
              !ordersError &&
              sellerOrders.length > 0 && (
                <div className="seller-orders-list">
                  {sellerOrders.map((order) => (
                    <article
                      className="seller-order-card"
                      key={order._id}
                    >
                      <div className="seller-order-header">
                        <div>
                          <span className="seller-order-reference">
                            {order.orderReference}
                          </span>

                          <small>
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
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

                      <div className="seller-order-customer">
                        <p className="eyebrow">CUSTOMER</p>

                        <strong>
                          {order.customer?.name || "Customer"}
                        </strong>

                        <span>
                          {order.customer?.email || "—"}
                        </span>
                      </div>

                      <div className="seller-order-products">
                        {(order.items || []).map((item, index) => (
                          <div
                            className="seller-order-product"
                            key={`${item.product?._id || "item"}-${index}`}
                          >
                            {item.product?.images?.[0] ? (
                              <img
                                src={
                                  item.product.images[0].startsWith("http")
                                    ? item.product.images[0]
                                    : `${API.replace("/api", "")}${item.product.images[0]}`
                                }
                                alt={item.name || "Product"}
                              />
                            ) : (
                              <div className="seller-order-product-placeholder">
                                A
                              </div>
                            )}

                            <div>
                              <strong>{item.name}</strong>

                              <span>
                                Qty: {item.quantity} ·{" "}
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="seller-order-details">
                        <div>
                          <span>Payment</span>
                          <strong>
                            {order.paymentStatus || "pending"}
                          </strong>
                        </div>

                        <div>
                          <span>Order total</span>
                          <strong>
                            {formatPrice(order.total)}
                          </strong>
                        </div>

                        <div>
                          <span>Your earnings</span>
                          <strong>
                            {formatPrice(order.sellerAmount)}
                          </strong>
                        </div>

                        <div>
                          <span>Courier</span>
                          <strong>
                            {order.courier?.name || "—"}
                          </strong>
                        </div>
                      </div>

                      <div className="seller-order-delivery">
                        <p className="eyebrow">DELIVERY</p>

                        <strong>
                          {order.delivery?.fullName || "—"}
                        </strong>

                        <span>
                          {order.delivery?.address || "—"}
                        </span>

                        <span>
                          {order.delivery?.city || ""},{" "}
                          {order.delivery?.state || ""}
                        </span>
                      </div>

                      {order.shipbubble?.orderId && (
                        <div className="seller-order-tracking">
                          <div>
                            <span>SHIPBUBBLE SHIPMENT</span>

                            <strong>
                              {order.shipbubble.orderId}
                            </strong>

                            {order.shipbubble.status && (
                              <small>
                                Status: {order.shipbubble.status}
                              </small>
                            )}
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

        {activeTab === "Store Settings" && (
          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STORE SETTINGS</p>
                <h2>Shipping & Pickup</h2>
                <p>
                  Add the address where your products will be picked up
                  for customer deliveries.
                </p>
              </div>
            </div>

            <div className="shipping-settings-card">
              <div className="shipping-settings-status">
                <div>
                  <span className="eyebrow">SHIPBUBBLE</span>
                  <strong>
                    {business.shipping?.addressValidated
                      ? "✓ Pickup address verified"
                      : "Pickup address not verified"}
                  </strong>
                </div>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();

                  if (!business) return;

                  setShippingSaving(true);
                  setMessage("");

                  try {
                    const response = await fetch(
                      `${API}/businesses/${business._id}/shipping/validate`,
                      {
                        method: "POST",
                        headers,
                        body: JSON.stringify(shippingForm),
                      }
                    );

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                      throw new Error(
                        data.message ||
                          "Unable to validate pickup address."
                      );
                    }

                    setBusiness((previous) => ({
                      ...previous,
                      shipping: data.shipping,
                    }));

                    setMessage(
                      "Pickup address verified and saved successfully."
                    );
                  } catch (error) {
                    console.error(error);
                    setMessage(
                      error.message ||
                        "Failed to validate pickup address."
                    );
                  } finally {
                    setShippingSaving(false);
                  }
                }}
              >
                <label>
                  Pickup contact name
                  <input
                    value={shippingForm.name}
                    onChange={(event) =>
                      setShippingForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your business or pickup name"
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={shippingForm.email}
                    onChange={(event) =>
                      setShippingForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="business@example.com"
                    required
                  />
                </label>

                <label>
                  Pickup phone
                  <input
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(event) =>
                      setShippingForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="08012345678"
                    required
                  />
                </label>

                <label>
                  Pickup address
                  <textarea
                    value={shippingForm.address}
                    onChange={(event) =>
                      setShippingForm((previous) => ({
                        ...previous,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Enter your business pickup address"
                    rows="3"
                    required
                  />
                </label>

                <div className="product-form-grid">
                  <label>
                    City
                    <input
                      value={shippingForm.city}
                      onChange={(event) =>
                        setShippingForm((previous) => ({
                          ...previous,
                          city: event.target.value,
                        }))
                      }
                      placeholder="City"
                    />
                  </label>

                  <label>
                    State
                    <input
                      value={shippingForm.state}
                      onChange={(event) =>
                        setShippingForm((previous) => ({
                          ...previous,
                          state: event.target.value,
                        }))
                      }
                      placeholder="State"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="dashboard-primary"
                  disabled={shippingSaving}
                >
                  {shippingSaving
                    ? "Verifying address..."
                    : "Verify & save pickup address"}
                </button>
              </form>
            </div>
          </section>
        )}


      </main>

      {showForm && (
        <div className="product-modal-backdrop">
          <div className="product-modal">
            <div className="product-modal-header">
              <div>
                <p className="eyebrow">
                  {editingProduct
                    ? "EDIT PRODUCT"
                    : "NEW PRODUCT"}
                </p>

                <h2>
                  {editingProduct
                    ? "Update your product"
                    : "Add a product"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <label>
                Product name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="e.g. Urban Classic Sneaker"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  placeholder="Tell customers about this product..."
                  rows="4"
                />
              </label>

              <div className="product-form-grid">
                <label>
                  Price (₦)
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={updateForm}
                    min="0"
                    step="1"
                    placeholder="34999"
                    required
                  />
                </label>

                <label>
                  Stock
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={updateForm}
                    min="0"
                    step="1"
                    placeholder="10"
                  />
                </label>
              </div>

              <div className="product-image-upload">
                <div className="product-image-upload-heading">
                  <span>Product images</span>
                  <small>Up to 5 photos</small>
                </div>

                <label className="product-image-dropzone">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    multiple
                    onChange={handleImageChange}
                  />

                  <span className="upload-icon">＋</span>
                  <strong>Add product photos</strong>
                  <small>Tap here to choose photos from your phone</small>
                </label>

                {form.images && form.images.length > 0 && (
                  <div className="product-image-preview-grid">
                    {form.images.slice(0, 5).map((image, index) => (
                      <div
                        className="product-image-preview"
                        key={`${image}-${index}`}
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Product preview ${index + 1}`}
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={saving}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={updateForm}
                  placeholder="Sneakers"
                  required
                />
              </label>

              <label>
                Status
                <div className="axiom-status-options">
                  {[
                    ["active", "Active"],
                    ["draft", "Draft"],
                    ["out_of_stock", "Out of stock"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`axiom-status-option ${
                        form.status === value ? "selected" : ""
                      }`}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          status: value,
                        }))
                      }
                    >
                      <span className="axiom-status-dot" />
                      <span>{label}</span>
                      {form.status === value && (
                        <span className="axiom-status-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </label>

              <div className="product-form-actions">
                <button
                  type="button"
                  className="product-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dashboard-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Save changes"
                    : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessDashboard;
