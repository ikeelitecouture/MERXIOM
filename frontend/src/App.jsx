import { useEffect, useState } from "react";
import "./App.css";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountPage from "./pages/AccountPage";

const API = import.meta.env.VITE_API_URL;
const CART_KEY = "axiom_cart";

const TEMP_SENDER_ADDRESS_CODE = 160022252;
const SHIPBUBBLE_CATEGORY_ID = 74794423;

function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStoredCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addItemToCart(product, quantity = 1) {
  const cart = getStoredCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    const stock = Number(product.stock || existing.stock || 999);

    existing.quantity = Math.min(
      existing.quantity + quantity,
      stock
    );
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: product.category,
      image: product.image || "",
      store: product.store || "AXIOM Store",
      businessId:
        product.business?._id ||
        product.business?.id ||
        product.businessId ||
        "",
      stock: Number(product.stock || 999),
      quantity,
    });
  }

  saveCart(cart);
  return cart;
}

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUserFromStorage() {
  try {
    const saved = localStorage.getItem("axiom_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function Header({ cartCount = 0 }) {
  const user = getUserFromStorage();

  return (
    <header className="site-header">
      <a href="/" className="brand">
        AXIOM
      </a>

      <nav className="main-nav">
        <a href="/">Market</a>
        <a href="/business">Business</a>
      </nav>

      <div className="header-actions">
        <a href="/cart" className="cart-button">
          Cart
          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}
        </a>

        {user ? (
          <a href="/account" className="nav-login">
            {user.name || "Account"}
          </a>
        ) : (
          <a href="/login" className="nav-login">
            Account
          </a>
        )}
      </div>
    </header>
  );
}

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`${API}/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load product"
          );
        }

        const products = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        const found = products.find(
          (item) =>
            String(item._id || item.id) === String(productId)
        );

        if (!found) {
          setProduct(null);
          return;
        }

        const image =
          found.images?.[0]
            ? found.images[0].startsWith("http")
              ? found.images[0]
              : `${API.replace("/api", "")}${found.images[0]}`
            : "";

        setProduct({
          ...found,
          id: found._id || found.id,
          image,
          store:
            found.business?.name ||
            found.businessName ||
            "AXIOM Store",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="product-page-state">
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page-state">
        <h1>Product not found</h1>
        <a href="/" className="primary-button">
          Back to Market
        </a>
      </div>
    );
  }

  const stock = Number(product.stock || 0);

  function handleAddToCart() {
    const cart = addItemToCart(product, quantity);

    setMessage(
      `Added to cart. You now have ${cart.reduce(
        (total, item) => total + item.quantity,
        0
      )} item(s).`
    );
  }

  return (
    <>
      <Header
        cartCount={getStoredCart().reduce(
          (total, item) => total + item.quantity,
          0
        )}
      />

      <main className="product-page">
        <a href="/" className="back-link">
          ← Back to market
        </a>

        <section className="product-detail-layout">
          <div className="product-detail-image">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="product-image-placeholder">
                AXIOM
              </div>
            )}
          </div>

          <div className="product-detail-content">
            <p className="eyebrow">
              {product.category || "Product"}
            </p>

            <h1>{product.name}</h1>

            <p className="product-detail-price">
              {formatPrice(product.price)}
            </p>

            <p className="product-detail-description">
              {product.description ||
                "Quality product available on AXIOM."}
            </p>

            <p className="product-store">
              Sold by{" "}
              <strong>
                {product.store || "AXIOM Store"}
              </strong>
            </p>

            <div className="quantity-control">
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.max(1, value - 1)
                  )
                }
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(
                      stock > 0 ? stock : 999,
                      value + 1
                    )
                  )
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleAddToCart}
              disabled={stock <= 0}
            >
              {stock <= 0
                ? "Out of stock"
                : "Add to cart"}
            </button>

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

            <div className="product-detail-links">
              <a href="/cart">View cart →</a>
              <a href="/business">
                Sell on AXIOM →
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Cart() {
  const [cart, setCart] = useState(getStoredCart());

  function updateCart(nextCart) {
    setCart(nextCart);
    saveCart(nextCart);
  }

  function changeQuantity(id, amount) {
    const nextCart = cart.map((item) => {
      if (item.id !== id) return item;

      const stock = Number(item.stock || 999);

      return {
        ...item,
        quantity: Math.max(
          1,
          Math.min(stock, item.quantity + amount)
        ),
      };
    });

    updateCart(nextCart);
  }

  function removeItem(id) {
    updateCart(
      cart.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    updateCart([]);
  }

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <>
        <Header />

        <main className="cart-main">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              🛒
            </div>

            <h2>Your cart is empty</h2>

            <p>
              Discover products from businesses on
              AXIOM.
            </p>

            <a href="/" className="primary-button">
              Explore the Market
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        cartCount={cart.reduce(
          (total, item) => total + item.quantity,
          0
        )}
      />

      <main className="cart-main">
        <div className="cart-heading">
          <div>
            <p className="eyebrow">Your selection</p>
            <h1>Your Cart</h1>
          </div>

          <button
            type="button"
            className="cart-clear"
            onClick={clearCart}
          >
            Clear cart
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <article
                className="cart-item"
                key={item.id}
              >
                <div className="cart-item-image">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      AXIOM
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <p>{item.store}</p>

                  <h2>{item.name}</h2>

                  <small>
                    {formatPrice(item.price)} each
                  </small>

                  <strong>
                    {formatPrice(
                      Number(item.price) *
                        item.quantity
                    )}
                  </strong>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() =>
                        removeItem(item.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  {formatPrice(
                    Number(item.price) *
                      item.quantity
                  )}
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>
                {formatPrice(subtotal)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <strong>
                {formatPrice(subtotal)}
              </strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={() => {
                window.location.href =
                  "/checkout";
              }}
            >
              Proceed to checkout
            </button>

            <p className="cart-secure">
              Secure checkout powered by AXIOM
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

function Checkout() {
  const [cart, setCart] = useState(
    getStoredCart()
  );

  const [user] = useState(
    getUserFromStorage()
  );

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    deliveryInstructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingRates, setLoadingRates] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rates, setRates] = useState([]);
  const [selectedCourier, setSelectedCourier] =
    useState(null);

  const [validatedAddressCode, setValidatedAddressCode] =
    useState(null);

  const [sellerAddressCode, setSellerAddressCode] =
    useState(null);

  const [shippingRequestToken, setShippingRequestToken] =
    useState("");

  useEffect(() => {
    setCart(getStoredCart());
  }, []);

  useEffect(() => {
    async function verifyPaystackPayment() {
      const params = new URLSearchParams(
        window.location.search
      );

      const reference = params.get("reference");

      if (!reference) {
        return;
      }

      const token =
        localStorage.getItem("axiom_token");

      if (!token) {
        setError(
          "Please sign in to verify your payment."
        );
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `${API}/payments/verify/${encodeURIComponent(
            reference
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Payment verification failed."
          );
        }

        setSuccess(
          `Payment successful! Order ${data.order.orderReference} is confirmed.`
        );

        localStorage.removeItem(CART_KEY);
        setCart([]);

        window.history.replaceState(
          {},
          document.title,
          "/checkout"
        );
      } catch (err) {
        console.error(
          "Payment verification error:",
          err
        );

        setError(
          err.message ||
            "Unable to verify your payment."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyPaystackPayment();
  }, []);

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  const deliveryFee = selectedCourier
    ? Number(selectedCourier.total || 0)
    : 0;

  const total = subtotal + deliveryFee;

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function getShippingRates() {
    setError("");
    setSuccess("");
    setRates([]);
    setSelectedCourier(null);

    const token =
      localStorage.getItem("axiom_token");

    if (!token) {
      setError(
        "Please sign in before continuing to checkout."
      );
      return;
    }

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.state
    ) {
      setError(
        "Please complete all delivery fields."
      );
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const businessIds = [
      ...new Set(
        cart
          .map((item) => item.businessId)
          .filter(Boolean)
      ),
    ];

    if (businessIds.length !== 1) {
      setError(
        "For now, checkout supports products from one business at a time."
      );
      return;
    }

    setLoadingRates(true);

    try {
      const businessResponse = await fetch(
        `${API}/businesses/${businessIds[0]}`
      );

      const businessData =
        await businessResponse.json();

      if (
        !businessResponse.ok ||
        !businessData.success ||
        !businessData.business?.shipping?.addressValidated ||
        !businessData.business?.shipping?.shipbubbleAddressCode
      ) {
        throw new Error(
          "This seller has not completed a verified pickup address."
        );
      }

      const senderAddressCode = Number(
        businessData.business.shipping.shipbubbleAddressCode
      );

      setSellerAddressCode(senderAddressCode);
      const validateResponse = await fetch(
        `${API}/shipping/validate-address`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            phone: form.phone,
            address: `${form.address}, ${form.city}, ${form.state}, Nigeria`,
          }),
        }
      );

      const validateData =
        await validateResponse.json();

      if (!validateResponse.ok) {
        throw new Error(
          validateData.message ||
            "Unable to validate delivery address."
        );
      }

      const addressData =
        validateData.data || {};

      const receiverAddressCode = Number(
        addressData.address_code ??
          addressData.addressCode ??
          addressData.code ??
          addressData.id ??
          0
      );

      if (!receiverAddressCode) {
        throw new Error(
          "The delivery address was not assigned a valid shipping code."
        );
      }

      setValidatedAddressCode(
        receiverAddressCode
      );

      const packageItems = cart.map(
        (item) => ({
          name: item.name,
          description:
            item.description ||
            `${item.name} from AXIOM`,
          unit_weight: 1,
          unit_amount: Number(item.price),
          quantity: Number(item.quantity),
        })
      );

      const ratesResponse = await fetch(
        `${API}/shipping/rates`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senderAddressCode:
              senderAddressCode,
            receiverAddressCode,
            pickupDate:
              getTomorrowDate(),
            categoryId:
              SHIPBUBBLE_CATEGORY_ID,
            packageItems,
            packageDimension: {
              length: 30,
              width: 20,
              height: 10,
            },
            deliveryInstructions:
              form.deliveryInstructions,
          }),
        }
      );

      const ratesData =
        await ratesResponse.json();

      if (!ratesResponse.ok) {
        throw new Error(
          ratesData.message ||
            "Unable to calculate delivery rates."
        );
      }

      const requestToken =
        ratesData.data?.request_token ||
        ratesData.request_token ||
        "";

      const couriers =
        ratesData.data?.couriers || [];

      if (couriers.length === 0) {
        throw new Error(
          "No delivery options are available for this address."
        );
      }

      const enrichedCouriers = couriers.map(
        (courier) => ({
          ...courier,
          request_token: requestToken
        })
      );

      setShippingRequestToken(requestToken);
      setRates(enrichedCouriers);

      const cheapest =
        ratesData.data?.cheapest_courier ||
        enrichedCouriers.reduce(
          (lowest, courier) =>
            Number(courier.total) <
            Number(lowest.total)
              ? courier
              : lowest,
          enrichedCouriers[0]
        );

      setSelectedCourier(cheapest);

      setSuccess(
        "Address validated. Delivery options are ready."
      );
    } catch (err) {
      console.error(
        "Checkout shipping error:",
        err.message
      );

      setError(
        err.message ||
          "Something went wrong while calculating delivery."
      );
    } finally {
      setLoadingRates(false);
    }
  }

  async function handleContinueToPayment() {
    setError("");
    setSuccess("");

    if (!selectedCourier) {
      setError(
        "Please select a delivery option first."
      );
      return;
    }

    if (!validatedAddressCode) {
      setError(
        "Please validate your delivery address first."
      );
      return;
    }

    if (!sellerAddressCode) {
      setError(
        "Seller pickup address is not available."
      );
      return;
    }

    const token =
      localStorage.getItem("axiom_token");

    if (!token) {
      window.location.href =
        "/login?redirect=/checkout";
      return;
    }

    setLoading(true);

    try {
      const orderResponse = await fetch(
        `${API}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
            delivery: {
              fullName: form.fullName,
              phone: form.phone,
              address: form.address,
              city: form.city,
              state: form.state,
            },
            deliveryFee,
            courier: {
              name:
                selectedCourier.courier_name,
              serviceCode: String(
                selectedCourier.service_code ||
                ""
              ),
              courierId: String(
                selectedCourier.courier_id ||
                ""
              ),
              requestToken:
                shippingRequestToken ||
                selectedCourier.request_token ||
                "",
            },
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData.success ||
        !orderData.order?._id
      ) {
        throw new Error(
          orderData.message ||
            "Unable to create your order."
        );
      }

      const paymentResponse =
        await fetch(
          `${API}/payments/initialize`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId:
                orderData.order._id,
            }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (
        !paymentResponse.ok ||
        !paymentData.success ||
        !paymentData.authorizationUrl
      ) {
        throw new Error(
          paymentData.message ||
            "Unable to initialize payment."
        );
      }

      window.location.href =
        paymentData.authorizationUrl;
    } catch (err) {
      console.error(
        "Checkout payment error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while starting payment."
      );
      setLoading(false);
    }
  }

  if (!localStorage.getItem("axiom_token")) {
    return (
      <>
        <Header />

        <main className="checkout-main">
          <section className="checkout-login-card">
            <p className="eyebrow">
              AXIOM Checkout
            </p>

            <h1>Sign in to continue</h1>

            <p>
              You need an AXIOM account to enter
              delivery details and calculate real
              shipping rates.
            </p>

            <a
              href="/login?redirect=/checkout"
              className="primary-button"
            >
              Sign in
            </a>

            <a
              href="/register"
              className="secondary-button"
            >
              Create an account
            </a>
          </section>
        </main>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <Header />

        <main className="checkout-main">
          <section className="checkout-login-card">
            <p className="eyebrow">
              AXIOM Checkout
            </p>

            <h1>Your cart is empty</h1>

            <p>
              Add a product before starting
              checkout.
            </p>

            <a
              href="/"
              className="primary-button"
            >
              Back to market
            </a>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        cartCount={cart.reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        )}
      />

      <main className="checkout-main">
        <div className="checkout-heading">
          <div>
            <p className="eyebrow">
              AXIOM Checkout
            </p>

            <h1>Delivery details</h1>

            <p>
              Enter your delivery information and
              AXIOM will calculate real courier
              options for your order.
            </p>
          </div>

          <a
            href="/cart"
            className="back-link"
          >
            ← Back to cart
          </a>
        </div>

        <div className="checkout-layout">
          <section className="checkout-form-card">
            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>01</span>
                <div>
                  <h2>Contact</h2>
                  <p>
                    Where should we reach you?
                  </p>
                </div>
              </div>

              <div className="checkout-form-grid">
                <label>
                  Full name
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+234..."
                  />
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <div className="checkout-section-heading">
                <span>02</span>
                <div>
                  <h2>Delivery address</h2>
                  <p>
                    Your exact delivery destination.
                  </p>
                </div>
              </div>

              <div className="checkout-form-grid">
                <label className="checkout-full">
                  Street address
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House number, street name"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </label>

                <label>
                  State
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </label>

                <label className="checkout-full">
                  Delivery instructions
                  <textarea
                    name="deliveryInstructions"
                    value={
                      form.deliveryInstructions
                    }
                    onChange={handleChange}
                    placeholder="Landmark, gate instructions or anything the courier should know"
                    rows="4"
                  />
                </label>
              </div>

              <button
                type="button"
                className="checkout-rate-button"
                onClick={getShippingRates}
                disabled={loadingRates}
              >
                {loadingRates
                  ? "Calculating delivery..."
                  : "Validate address & find delivery"}
              </button>

              {success && (
                <div className="checkout-success">
                  {success}
                </div>
              )}

              {error && (
                <div className="checkout-error">
                  {error}
                </div>
              )}
            </div>

            {rates.length > 0 && (
              <div className="checkout-section">
                <div className="checkout-section-heading">
                  <span>03</span>
                  <div>
                    <h2>
                      Choose delivery
                    </h2>
                    <p>
                      Select the courier and service
                      that works for you.
                    </p>
                  </div>
                </div>

                <div className="courier-list">
                  {rates.map((courier) => {
                    const selected =
                      selectedCourier?.courier_id ===
                      courier.courier_id;

                    return (
                      <button
                        type="button"
                        key={`${courier.courier_id}-${courier.service_code}`}
                        className={`courier-card ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedCourier(
                            courier
                          )
                        }
                      >
                        <div className="courier-radio">
                          {selected ? "✓" : ""}
                        </div>

                        <div className="courier-main">
                          <strong>
                            {
                              courier.courier_name
                            }
                          </strong>

                          <span>
                            {courier.service_type ||
                              "Delivery service"}
                          </span>

                          <small>
                            Pickup:{" "}
                            {courier.pickup_eta ||
                              "—"}
                            {" • "}
                            Delivery:{" "}
                            {courier.delivery_eta ||
                              "—"}
                          </small>
                        </div>

                        <div className="courier-price">
                          <strong>
                            {formatPrice(
                              courier.total
                            )}
                          </strong>

                          {courier.ratings && (
                            <span>
                              ★{" "}
                              {courier.ratings}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <aside className="checkout-summary">
            <div className="checkout-summary-inner">
              <p className="eyebrow">
                Your order
              </p>

              <h2>Order summary</h2>

              <div className="checkout-order-items">
                {cart.map((item) => (
                  <div
                    className="checkout-order-item"
                    key={item.id}
                  >
                    <div className="checkout-order-image">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                        />
                      ) : (
                        <span>AXIOM</span>
                      )}
                    </div>

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        Qty: {item.quantity}
                      </small>
                    </div>

                    <strong>
                      {formatPrice(
                        Number(item.price) *
                          item.quantity
                      )}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <strong>
                  {formatPrice(subtotal)}
                </strong>
              </div>

              <div className="checkout-summary-row">
                <span>Delivery</span>

                <strong>
                  {selectedCourier
                    ? formatPrice(
                        deliveryFee
                      )
                    : "Select courier"}
                </strong>
              </div>

              {selectedCourier && (
                <div className="selected-courier-note">
                  <span>
                    Delivery by
                  </span>

                  <strong>
                    {
                      selectedCourier.courier_name
                    }
                  </strong>
                </div>
              )}

              <div className="checkout-total">
                <span>Total</span>

                <strong>
                  {formatPrice(total)}
                </strong>
              </div>

              <button
                type="button"
                className="checkout-button"
                onClick={
                  handleContinueToPayment
                }
                disabled={
                  loading ||
                  !selectedCourier
                }
              >
                Continue to payment
              </button>

              <p className="checkout-security">
                Your delivery rate is calculated
                from live courier data.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Market() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [cartCount, setCartCount] =
    useState(
      getStoredCart().reduce(
        (total, item) =>
          total + item.quantity,
        0
      )
    );

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          `${API}/products`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load products"
          );
        }

        const rawProducts =
          Array.isArray(data)
            ? data
            : data.products ||
              data.data ||
              [];

        const mapped =
          rawProducts.map((product) => ({
            ...product,
            id:
              product._id ||
              product.id,
            image:
              product.images?.[0]
                ? product.images[0].startsWith(
                    "http"
                  )
                  ? product.images[0]
                  : `${API.replace("/api", "")}${product.images[0]}`
                : "",
            store:
              product.business?.name ||
              product.businessName ||
              "AXIOM Store",
            businessId:
              product.business?._id ||
              product.business?.id ||
              product.businessId ||
              "",
          }));

        setProducts(mapped);
      } catch (err) {
        console.error(err);
        setError(
          err.message ||
            "Unable to load the market."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((product) =>
            String(
              product.category || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ),
  ];

  const filteredProducts =
    products.filter((product) => {
      const matchesSearch =
        product.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        product.description
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesCategory =
        category === "All" ||
        product.category ===
          category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });

  function handleAdd(product) {
    const cart = addItemToCart(
      product,
      1
    );

    setCartCount(
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0
      )
    );
  }

  return (
    <>
      <Header cartCount={cartCount} />

      <main>
        <section className="market-hero">
          <div>
            <p className="eyebrow">
              The Nigerian digital marketplace
            </p>

            <h1>
              Discover.
              <br />
              Buy.
              <br />
              Build.
            </h1>

            <p className="hero-copy">
              AXIOM connects customers with
              Nigerian businesses, products
              and brands in one modern
              marketplace.
            </p>

            <div className="hero-actions">
              <a
                href="#products"
                className="primary-button"
              >
                Explore products
              </a>

              <a
                href="/business"
                className="secondary-button"
              >
                Start selling
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/products/sneakers-1.png"
              alt="AXIOM product"
            />
          </div>
        </section>

        <section className="market-controls">
          <div className="search-box">
            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="category-list">
            {categories.map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    category === item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategory(item)
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
        </section>

        <section
          id="products"
          className="products-section"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Shop the marketplace
              </p>

              <h2>
                Featured products
              </h2>
            </div>

            <span>
              {filteredProducts.length}{" "}
              product
              {filteredProducts.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          {loading && (
            <div className="product-page-state">
              <p>
                Loading products...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="product-page-state">
              <h3>
                Unable to load products
              </h3>

              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredProducts.length ===
              0 && (
              <div className="product-page-state">
                <h3>
                  No products found
                </h3>

                <p>
                  Try another search or
                  category.
                </p>
              </div>
            )}

          <div className="product-grid">
            {filteredProducts.map(
              (product) => (
                <article
                  className="market-product-card"
                  key={product.id}
                >
                  <a
                    href={`/product/${product.id}`}
                    className="market-product-image"
                  >
                    {product.image ? (
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        AXIOM
                      </div>
                    )}
                  </a>

                  <div className="market-product-info">
                    <div>
                      <p>
                        {product.category ||
                          "Product"}
                      </p>

                      <h3>
                        {product.name}
                      </h3>

                      <small>
                        {product.store}
                      </small>
                    </div>

                    <strong>
                      {formatPrice(
                        product.price
                      )}
                    </strong>
                  </div>

                  <div className="market-product-actions">
                    <a
                      href={`/product/${product.id}`}
                      className="secondary-button"
                    >
                      View
                    </a>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        handleAdd(
                          product
                        )
                      }
                      disabled={
                        Number(
                          product.stock
                        ) <= 0
                      }
                    >
                      {Number(
                        product.stock
                      ) <= 0
                        ? "Out of stock"
                        : "Add to cart"}
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="business-banner">
          <div>
            <p className="eyebrow">
              For Nigerian businesses
            </p>

            <h2>
              Turn your business into a
              digital storefront.
            </h2>

            <p>
              Create your AXIOM business,
              list products and start
              reaching customers online.
            </p>
          </div>

          <a
            href="/business"
            className="primary-button"
          >
            Open your business
          </a>
        </section>

        <section className="discover-section">
          <p className="eyebrow">
            More coming to AXIOM
          </p>

          <h2>
            Discover businesses.
            <br />
            Discover people.
            <br />
            Discover possibilities.
          </h2>
        </section>
      </main>

      <footer className="site-footer">
        <strong>AXIOM</strong>

        <span>
          Nigerian commerce, built for
          the next generation.
        </span>
      </footer>
    </>
  );
}

function App() {
  const path =
    window.location.pathname;

  const productMatch =
    path.match(
      /^\/product\/([^/]+)$/
    );

  if (productMatch) {
    return (
      <ProductDetails
        productId={
          productMatch[1]
        }
      />
    );
  }

  if (path === "/cart") {
    return <Cart />;
  }

  if (path === "/checkout") {
    return <Checkout />;
  }

  if (path === "/business") {
    return <BusinessDashboard />;
  }

  if (path === "/admin") {
    return <AdminDashboard />;
  }

  if (
    path === "/login" ||
    path === "/register"
  ) {
    return <AuthPage />;
  }

  if (path === "/forgot-password") {
    return <ForgotPassword />;
  }

  if (path === "/reset-password") {
    return <ResetPassword />;
  }

  if (path === "/account") {
    return <AccountPage />;
  }

  return <Market />;
}

export default App;
