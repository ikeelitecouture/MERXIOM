import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountPage from "./pages/AccountPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";

const API = import.meta.env.VITE_API_URL;
const CART_KEY = "merxiom_cart";

const TEMP_SENDER_ADDRESS_CODE = 160022252;
const SHIPBUBBLE_CATEGORY_ID = 74794423;




function MERXIOMInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (standalone) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  async function installMERXIOM() {
    if (!installEvent) return;

    installEvent.prompt();

    const result = await installEvent.userChoice;

    if (result.outcome === "accepted") {
      setInstalled(true);
    }

    setInstallEvent(null);
  }

  if (installed || !installEvent) {
    return null;
  }

  return (
    <button
      type="button"
      className="merxiom-install-prompt"
      onClick={installMERXIOM}
      aria-label="Install MERXIOM"
    >
      <span className="merxiom-install-icon">↓</span>

      <span>
        <strong>Install MERXIOM</strong>
        <small>Get the MERXIOM app on your phone</small>
      </span>
    </button>
  );
}

function MERXIOMWhatsApp() {
  const phone = "2348109174369";

  const message =
    "Hello MERXIOM 👋 I’m interested in MERXIOM and I’d like to make an enquiry.";

  const url =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="merxiom-whatsapp"
      aria-label="Chat with MERXIOM on WhatsApp"
      title="Chat with MERXIOM on WhatsApp"
    >
      <span className="merxiom-whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.49 0 .14 5.34.14 11.92c0 2.1.55 4.15 1.59 5.96L.04 24l6.26-1.64a11.94 11.94 0 0 0 5.75 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.46-8.43ZM12.06 21.86h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.88 9.88 0 0 1-1.52-5.33c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.02 2.91a9.87 9.87 0 0 1 2.92 7.03c0 5.48-4.46 9.94-9.99 9.94Zm5.45-7.45c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.69.15-.2.3-.79.97-.97 1.17-.18.2-.36.23-.66.08-.3-.15-1.25-.46-2.39-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.66-.94-2.28-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.53.08-.81.38-.28.3-1.06 1.03-1.06 2.52s1.09 2.92 1.24 3.12c.15.2 2.15 3.29 5.21 4.61.73.31 1.3.5 1.74.64.73.23 1.4.2 1.93.12.59-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.4-.08-.13-.28-.2-.58-.36Z"/>
        </svg>
      </span>
      <span className="merxiom-whatsapp-label">
        Chat with us
      </span>
    </a>
  );
}

function MERXIOMAIAccess() {
  return (
    <button
      type="button"
      className="merxiom-ai-launcher"
      onClick={() => {
        window.location.href = "/ai";
      }}
    >
      Ask MERXIOM AI
    </button>
  );
}

function MERXIOMAI() {
  const [open, setOpen] = useState(
    window.location.pathname === "/ai"
  );
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I'm MERXIOM AI. Ask me about MERXIOM, products, orders, business, or anything you want to know."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  function getToken() {
    return localStorage.getItem("merxiom_token");
  }

  async function loadConversations() {
    const token = getToken();

    if (!token) return [];

    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API}/ai/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const savedConversations = data.conversations || [];
        setConversations(savedConversations);
        return savedConversations;
      }

      return [];
    } catch (error) {
      console.error(
        "MERXIOM chat history error:",
        error
      );
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openConversation(id) {
    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/ai/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load conversation."
        );
      }

      setConversationId(data.conversation._id);
      localStorage.setItem(
        "merxiom_active_ai_conversation",
        String(data.conversation._id)
      );

      setMessages(
        (data.conversation.messages || []).map(
          (item) => ({
            role:
              item.role === "user"
                ? "user"
                : "ai",
            text: item.content
          })
        )
      );
    } catch (error) {
      console.error(
        "MERXIOM conversation error:",
        error
      );
    }
  }

  async function deleteConversation() {
    if (!conversationId) return;

    const token = getToken();

    if (!token) return;

    const confirmed = window.confirm(
      "Delete this chat? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/ai/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete conversation."
        );
      }

      setConversations((current) =>
        current.filter(
          (conversation) =>
            String(conversation._id || conversation.id) !==
            String(conversationId)
        )
      );

      setConversationId(null);
      localStorage.removeItem("merxiom_active_ai_conversation");

      setMessages([
        {
          role: "ai",
          text: "Chat deleted 👋 Start a fresh conversation whenever you're ready."
        }
      ]);

      setMessage("");
    } catch (error) {
      console.error(
        "MERXIOM delete conversation error:",
        error
      );

      window.alert(
        error.message || "Unable to delete this chat."
      );
    }
  }

  function startNewConversation() {
    setConversationId(null);
    localStorage.removeItem("merxiom_active_ai_conversation");

    setMessages([
      {
        role: "ai",
        text: "Fresh chat started 👋 What do you want to know?"
      }
    ]);

    setMessage("");
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    event.target.value = "";
  }

  async function askAI(event) {
    event.preventDefault();

    const text = message.trim();
    if (!text || loading) return;

    const token = getToken();

    if (!token) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text:
            "Please sign in to use MERXIOM AI and save your conversations."
        }
      ]);
      return;
    }

    setMessage("");

    const imageForRequest = selectedImage;
    setSelectedImage(null);

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text
      }
    ]);

    setLoading(true);

    try {
      const requestBody = imageForRequest
        ? (() => {
            const formData = new FormData();
            formData.append("message", text);
            if (conversationId) {
              formData.append("conversationId", conversationId);
            }
            formData.append("image", imageForRequest);
            return formData;
          })()
        : JSON.stringify({
            message: text,
            conversationId
          });

      const response = await fetch(
        `${API}/ai/shopping`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(imageForRequest
              ? {}
              : { "Content-Type": "application/json" })
          },
          body: requestBody
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "MERXIOM AI is unavailable."
        );
      }

      setConversationId(data.conversationId);

      if (data.conversationId) {
        localStorage.setItem(
          "merxiom_active_ai_conversation",
          String(data.conversationId)
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: data.message,
          products: data.matchingProducts || [],
          comparison: data.comparisonProducts || []
        }
      ]);

      await loadConversations();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text:
            error.message ||
            "Sorry, I couldn't process that request."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handleSuggestedPrompt = (event) => {
      const prompt = event.detail?.prompt;
      if (!prompt) return;

      setMessage(prompt);
      setOpen(true);
    };

    window.addEventListener("merxiom-ai-prompt", handleSuggestedPrompt);

    return () => {
      window.removeEventListener("merxiom-ai-prompt", handleSuggestedPrompt);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const restoreConversation = async () => {
      const list = await loadConversations();

      if (!conversationId && Array.isArray(list) && list.length > 0) {
        const savedId = localStorage.getItem("merxiom_active_ai_conversation");

        if (savedId && list.some((conversation) => String(conversation._id || conversation.id) === String(savedId))) {
          await openConversation(savedId);
        } else {
          const latestId = list[0]?._id || list[0]?.id;

          if (latestId) {
            await openConversation(latestId);
          }
        }
      }
    };

    restoreConversation();
  }, [open]);

  return (
    <>
      {open && (
        <div className="merxiom-ai-overlay">
          <section className="merxiom-ai-panel">
            <div className="merxiom-ai-header">
              <div className="merxiom-ai-header-left">
                <button
                  type="button"
                  className="merxiom-ai-mobile-menu"
                  aria-label="Open chat history"
                  onClick={() => setMobileHistoryOpen(true)}
                >
                  ☰
                </button>

                <a
                  href="/"
                  className="merxiom-ai-back"
                  aria-label="Back to MERXIOM"
                >
                  ←
                </a>

                <div className="merxiom-ai-brand">
                  <strong>MERXIOM AI</strong>
                  <span>Your intelligent shopping assistant</span>
                </div>
              </div>

              <div className="merxiom-ai-header-actions">
                <button
                  type="button"
                  onClick={startNewConversation}
                >
                  ＋ New chat
                </button>

                {conversationId && (
                  <button
                    type="button"
                    className="merxiom-ai-delete-chat"
                    onClick={deleteConversation}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="merxiom-ai-layout">
              {mobileHistoryOpen && (
                <button
                  type="button"
                  className="merxiom-ai-mobile-backdrop"
                  aria-label="Close chat history"
                  onClick={() => setMobileHistoryOpen(false)}
                />
              )}

              <aside
                className={`merxiom-ai-history ${
                  mobileHistoryOpen ? "mobile-open" : ""
                }`}
              >
                <div className="merxiom-ai-history-heading">
                  <span>Chats</span>
                  <small>{conversations.length}</small>
                </div>

                <button
                  type="button"
                  className="merxiom-ai-new-chat"
                  onClick={() => {
                    startNewConversation();
                    setMobileHistoryOpen(false);
                  }}
                >
                  <span>＋</span>
                  <strong>New chat</strong>
                </button>

                <div className="merxiom-ai-history-list">
                  {historyLoading ? (
                    <span className="merxiom-ai-history-empty">
                      Loading chats...
                    </span>
                  ) : conversations.length === 0 ? (
                    <span className="merxiom-ai-history-empty">
                      Your conversations will appear here.
                    </span>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation._id}
                        className={
                          String(conversation._id) === String(conversationId)
                            ? "active"
                            : ""
                        }
                        onClick={async () => {
                          await openConversation(conversation._id);
                          setMobileHistoryOpen(false);
                        }}
                      >
                        <span>◌</span>
                        <strong>
                          {conversation.title || "Conversation"}
                        </strong>
                      </button>
                    ))
                  )}
                </div>
              </aside>

            <div className="merxiom-ai-chat">
                <div className="merxiom-ai-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`merxiom-ai-message ${item.role}`}
              >
                <div className="merxiom-ai-message-text">
                  {item.role === "ai" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.text || ""}
                    </ReactMarkdown>
                  ) : (
                    item.text
                  )}
                </div>

                {item.comparison?.length >= 2 && (
                  <div className="merxiom-ai-comparison">
                    <div className="merxiom-ai-comparison-heading">
                      <strong>Product comparison</strong>
                      <span>{item.comparison.length} products</span>
                    </div>

                    <div className="merxiom-ai-comparison-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Details</th>
                            {item.comparison.map((product) => (
                              <th key={product.id}>
                                {product.name || "Product"}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          <tr>
                            <th>Price</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {formatPrice(product.price)}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Category</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.category || "—"}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Brand</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.brand || "—"}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Colours</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.colors?.length
                                  ? product.colors.join(", ")
                                  : "—"}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Sizes</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.sizes?.length
                                  ? product.sizes.join(", ")
                                  : "—"}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Stock</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.stock > 0
                                  ? `${product.stock} available`
                                  : "Out of stock"}
                              </td>
                            ))}
                          </tr>

                          <tr>
                            <th>Location</th>
                            {item.comparison.map((product) => (
                              <td key={product.id}>
                                {product.location || "—"}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {item.products?.length > 0 && (
                  <div className="merxiom-ai-product-results">
                    {item.products.map((product) => {
                      const productId =
                        product._id || product.id;

                      const image =
                        product.images?.[0]
                          ? product.images[0].startsWith("http")
                            ? product.images[0]
                            : `${API.replace(/\/api\/?$/, "")}${product.images[0]}`
                          : product.image || "";

                      return (
                        <article
                          key={productId}
                          className="merxiom-ai-product-card"
                        >
                          <a
                            href={`/product/${productId}`}
                            className="merxiom-ai-product-image"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={product.name || "Product"}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span>MERXIOM</span>
                            )}
                          </a>

                          <div className="merxiom-ai-product-info">
                            <span>
                              {product.category || "Product"}
                            </span>

                            <h3>{product.name}</h3>

                            <strong>
                              {formatPrice(product.price)}
                            </strong>

                            <small>
                              {Number(product.stock || 0) > 0
                                ? `${product.stock} available`
                                : "Out of stock"}
                            </small>

                            <a
                              href={`/product/${productId}`}
                              className="merxiom-ai-product-view"
                            >
                              View product →
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="merxiom-ai-message ai">
                MERXIOM AI is thinking...
              </div>
            )}
          </div>

          {selectedImage && (
            <div className="merxiom-ai-image-preview">
              <span>
                📷 {selectedImage.name}
              </span>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
              >
                Remove
              </button>
            </div>
          )}

          <form
            className="merxiom-ai-form"
            onSubmit={askAI}
          >
            <div className="merxiom-ai-attach">
              <button
                type="button"
                className="merxiom-ai-plus"
                title="Add"
                aria-label="Add photo"
                onClick={(event) => {
                  const menu =
                    event.currentTarget.parentElement.querySelector(
                      ".merxiom-ai-attach-menu"
                    );

                  if (menu) {
                    menu.classList.toggle("open");
                  }
                }}
              >
                +
              </button>

              <div className="merxiom-ai-attach-menu">
                <label className="merxiom-ai-attach-option">
                  <span className="merxiom-ai-attach-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.5 6.5h2l1.2-1.5h4.6l1.2 1.5h1.5A2.5 2.5 0 0 1 21.5 9v8A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V9A2.5 2.5 0 0 1 5 6.5h3.5Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  </span>
                  <span>
                    <strong>Take photo</strong>
                    <small>Use your camera</small>
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    hidden
                  />
                </label>

                <label className="merxiom-ai-attach-option">
                  <span className="merxiom-ai-attach-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="8.5" cy="9" r="1.5" />
                      <path d="m5.5 17 4.5-4.5 3.2 3.2 2.3-2.3 3 3.6" />
                    </svg>
                  </span>
                  <span>
                    <strong>Choose photo</strong>
                    <small>Select from gallery</small>
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    hidden
                  />
                </label>

                <label className="merxiom-ai-attach-option">
                  <span className="merxiom-ai-attach-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m8.5 12.5 5.7-5.7a3.5 3.5 0 0 1 5 5l-7.6 7.6a5 5 0 0 1-7.1-7.1l7.2-7.2a2.5 2.5 0 0 1 3.5 3.5l-6.7 6.7a1.5 1.5 0 0 0 2.1 2.1l6-6" />
                    </svg>
                  </span>
                  <span>
                    <strong>Upload image</strong>
                    <small>Find a product from an image</small>
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    hidden
                  />
                </label>
              </div>
            </div>

            <input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Ask anything..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={
                loading || !message.trim()
              }
            >
              Send
            </button>
          </form>
              </div>
            </div>
          </section>
        </div>
      )}

      {window.location.pathname !== "/ai" && (
        <button
          type="button"
          className="merxiom-ai-launcher"
          onClick={() => {
            window.location.href = "/ai";
          }}
        >
          Ask MERXIOM AI
        </button>
      )}
    </>
  );
}

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
      store: product.store || "MERXIOM Store",
      businessId:
        product.business?._id ||
        product.business?.id ||
        product.businessId ||
        "",
      stock: Number(product.stock || 999),
      quantity,
      shipping: {
        weight: Number(product.shipping?.weight || 1),
        length: Number(product.shipping?.length || 30),
        width: Number(product.shipping?.width || 20),
        height: Number(product.shipping?.height || 10),
      },
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
    const saved = localStorage.getItem("merxiom_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function Header({ cartCount = 0 }) {
  const user = getUserFromStorage();
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();

    const query =
      event.currentTarget.elements.search?.value.trim();

    if (query) {
      window.location.href =
        `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <header className="site-header">
      <div className="header-top-bar">
        <div className="header-top-inner">
          <a
            href="/business"
            className="header-seller-link"
          >
            Sell on MERXIOM
          </a>

          <div className="header-top-links">
            <a href="/help">Help</a>

            <a
              href={user ? "/account" : "/login"}
            >
              {user
                ? user.name || "Account"
                : "Account"}
            </a>
          </div>
        </div>
      </div>

      <div className="header-main-row">
        <div className="header-main-inner">
          <button
            type="button"
            className="header-menu-button"
            aria-label={mobileHeaderMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileHeaderMenuOpen}
            onClick={() => setMobileHeaderMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a
            href="/"
            className="header-brand"
            aria-label="MERXIOM home"
          >
            <img
              src="/logo.png"
              alt="MERXIOM"
              className="brand-logo"
            />
          </a>

          <form
            className="header-search"
            onSubmit={handleSearch}
          >
            <input
              name="search"
              type="search"
              placeholder="Search for products, brands and more..."
              aria-label="Search products"
            />

            <button
              type="submit"
              aria-label="Search"
            >
              Search
            </button>
          </form>

          <a
            href="/cart"
            className="header-cart"
            aria-label={`Cart${
              cartCount
                ? `, ${cartCount} items`
                : ""
            }`}
          >
            <span className="header-cart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
                <circle cx="10" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
              </svg>
            </span>

            <span className="header-cart-text">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="header-cart-count">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>

      <nav
        className="header-category-nav"
        aria-label="Marketplace navigation"
      >
        <div className="header-category-inner">
          <a
            href="/discover"
            className="header-category-item header-category-primary"
          >
            Categories
          </a>

          <a
            href="/deals"
            className="header-category-item"
          >
            Today's Deals
          </a>

          <a
            href="/featured"
            className="header-category-item"
          >
            Featured
          </a>

          <a
            href="/category/fashion"
            className="header-category-item"
          >
            Fashion
          </a>

          <a
            href="/category/electronics"
            className="header-category-item"
          >
            Electronics
          </a>

          <a
            href="/category/beauty"
            className="header-category-item"
          >
            Beauty
          </a>

          <a
            href="/category/home-and-living"
            className="header-category-item"
          >
            Home & Living
          </a>

          <a
            href="/ai"
            className="header-category-item header-category-ai"
          >
            MERXIOM AI
          </a>

          <a
            href="/business"
            className="header-category-item"
          >
            Sell on MERXIOM
          </a>
        </div>
      </nav>

      {mobileHeaderMenuOpen && (
        <>
          <button
            type="button"
            className="site-mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileHeaderMenuOpen(false)}
          />

          <aside className="site-mobile-menu" aria-label="MERXIOM menu">
            <div className="site-mobile-menu-head">
              <strong>MERXIOM</strong>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileHeaderMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <nav className="site-mobile-menu-links">
              <a href="/discover">Discover</a>
              <a href="/deals">Today's Deals</a>
              <a href="/featured">Featured</a>
              <a href="/ai">MERXIOM AI</a>
              <a href="/business">Sell on MERXIOM</a>
              <a href="/account">Account</a>
              <a href="/cart">Cart</a>
            </nav>

            <div className="site-mobile-menu-section">
              <span>SHOP BY CATEGORY</span>
              {[
                ["Fashion", "fashion"],
                ["Phones & Tablets", "phones-and-tablets"],
                ["Electronics", "electronics"],
                ["Beauty", "beauty"],
                ["Home & Living", "home-and-living"],
                ["Computers", "computers"],
                ["Shoes", "shoes"],
                ["Accessories", "accessories"],
                ["Sports & Fitness", "sports-and-fitness"],
                ["Baby & Kids", "baby-and-kids"],
                ["Automotive", "automotive"],
                ["Services", "services"],
              ].map(([name, slug]) => (
                <a key={slug} href={`/category/${slug}`}>
                  {name}
                </a>
              ))}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

function MobileBottomNav({ cartCount = 0 }) {
  const user = getUserFromStorage();

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

      <a
        href={user ? "/account" : "/login"}
        className="mobile-bottom-nav-item"
      >
        <span className="mobile-bottom-nav-icon">◯</span>
        <span>Account</span>
      </a>
    </nav>
  );
}

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

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

        const image = found.images?.[0]
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
            "MERXIOM Store",
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

  function handleBuyNow() {
    addItemToCart(product, quantity);
    window.location.href = "/checkout";
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
              <button
                type="button"
                className="product-image-button"
                onClick={() => setImagePreviewOpen(true)}
                aria-label="Preview product image"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                />

                <span className="product-image-zoom">
                  🔍 View image
                </span>
              </button>
            ) : (
              <div className="product-image-placeholder">
                MERXIOM
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

            <div className="product-stock-info">
              {stock > 0 ? (
                <>
                  <span className="stock-dot">●</span>
                  {stock} available
                </>
              ) : (
                <span>Out of stock</span>
              )}
            </div>

            <div className="product-detail-divider" />

            <p className="product-detail-description">
              {product.description ||
                "Quality product available on MERXIOM."}
            </p>

            <div className="product-detail-meta">
              <div>
                <span>Category</span>
                <strong>
                  {product.category || "General"}
                </strong>
              </div>

              <div>
                <span>Seller</span>
                <strong>
                  {product.business?.name ||
                    product.store ||
                    "MERXIOM Store"}
                </strong>
              </div>

              {product.brand && (
                <div>
                  <span>Brand</span>
                  <strong>{product.brand}</strong>
                </div>
              )}

              {product.location && (
                <div>
                  <span>Location</span>
                  <strong>{product.location}</strong>
                </div>
              )}

              {product.colors?.length > 0 && (
                <div>
                  <span>Colours</span>
                  <strong>
                    {product.colors.join(", ")}
                  </strong>
                </div>
              )}

              {product.sizes?.length > 0 && (
                <div>
                  <span>Sizes</span>
                  <strong>
                    {product.sizes.join(", ")}
                  </strong>
                </div>
              )}
            </div>

            <div className="product-purchase-area">

              <div className="quantity-label">
                <span>Quantity</span>

                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                    disabled={stock <= 0}
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
                    disabled={stock <= 0}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-action-buttons">

                <button
                  type="button"
                  className="product-add-cart-button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                >
                  🛒 Add to cart
                </button>

                <button
                  type="button"
                  className="product-buy-now-button"
                  onClick={handleBuyNow}
                  disabled={stock <= 0}
                >
                  Buy now
                </button>

              </div>

              {message && (
                <p className="success-message">
                  {message}
                </p>
              )}

            </div>

            <div className="product-detail-links">
              <a href="/cart">
                🛒 View cart →
              </a>

              <a href="/business">
                Sell on MERXIOM →
              </a>
            </div>

          </div>
        </section>
      </main>

      {imagePreviewOpen && product.image && (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            type="button"
            className="product-image-lightbox-close"
            onClick={() => setImagePreviewOpen(false)}
            aria-label="Close image preview"
          >
            ×
          </button>

          <img
            src={product.image}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <MobileBottomNav
        cartCount={getStoredCart().reduce(
          (total, item) => total + item.quantity,
          0
        )}
      />
    </>
  );
}

function Cart() {
  const [cart, setCart] = useState(getStoredCart());
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/products`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        const products = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setRecommendedProducts(products.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setRecommendedProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
              MERXIOM.
            </p>

            <div className="cart-empty-actions">
              <a href="/" className="primary-button">
                Explore the Market
              </a>

              <a href="/discover" className="cart-discover-link">
                Discover more
              </a>
            </div>
          </div>

          {recommendedProducts.length > 0 && (
            <section className="cart-recommendations">
              <div className="cart-recommendations-heading">
                <div>
                  <p className="eyebrow">KEEP EXPLORING</p>
                  <h2>You may also like</h2>
                  <span className="cart-recommendations-subtitle">
                    More products worth discovering on MERXIOM
                  </span>
                </div>

                <a href="/discover" className="cart-recommendations-view-all">
                  View all
                </a>
              </div>

              <div className="cart-products-row">
                {recommendedProducts.map((product) => {
                  const rawImage =
                    Array.isArray(product.images) && product.images.length
                      ? product.images[0]
                      : product.image || "";

                  const image = rawImage
                    ? rawImage.startsWith("http")
                      ? rawImage
                      : `${API.replace(/\/api\/?$/, "")}${rawImage.startsWith("/") ? rawImage : `/${rawImage}`}`
                    : "/logo.png";

                  const price = Number(product.price || 0);
                  const stock = Number(product.stock || 0);
                  const category = product.category || "Marketplace";

                  return (
                    <a
                      key={product._id || product.id}
                      href={`/product/${product._id || product.id}`}
                      className="cart-recommendation-card"
                    >
                      <div className="cart-recommendation-image">
                        <img
                          src={image}
                          alt={product.name || "Product"}
                          loading="lazy"
                        />

                        <span className="cart-recommendation-badge">
                          {stock > 0 ? "AVAILABLE" : "SOLD OUT"}
                        </span>

                        <span className="cart-recommendation-arrow">
                          →
                        </span>
                      </div>

                      <div className="cart-recommendation-info">
                        <div className="cart-recommendation-meta">
                          <span className="cart-recommendation-category">
                            {category}
                          </span>

                          {stock > 0 && (
                            <span className="cart-recommendation-stock">
                              In stock
                            </span>
                          )}
                        </div>

                        <h3>{product.name || "Product"}</h3>

                        <div className="cart-recommendation-price-row">
                          <strong>
                            ₦{price.toLocaleString()}
                          </strong>
                        </div>

                        {product.business?.name && (
                          <p className="cart-recommendation-seller">
                            <span>Sold by</span>
                            {product.business.name}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <MobileBottomNav />
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
                      MERXIOM
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
              Secure checkout powered by MERXIOM
            </p>
          </aside>
        </div>
      </main>

      <MobileBottomNav cartCount={cart.reduce(
        (total, item) => total + item.quantity,
        0
      )} />
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
    async function loadSavedAddress() {
      const token =
        localStorage.getItem("merxiom_token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `${API}/auth/addresses`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data.success ||
          !Array.isArray(data.addresses) ||
          data.addresses.length === 0
        ) {
          return;
        }

        const savedAddress =
          data.addresses.find(
            (item) => item.isDefault
          ) || data.addresses[0];

        setForm((current) => ({
          ...current,
          fullName:
            savedAddress.fullName ||
            current.fullName,
          phone:
            savedAddress.phone ||
            current.phone,
          address:
            savedAddress.address ||
            current.address,
          city:
            savedAddress.city ||
            current.city,
          state:
            savedAddress.state ||
            current.state,
        }));
      } catch (error) {
        console.error(
          "Checkout saved address error:",
          error
        );
      }
    }

    loadSavedAddress();
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
        localStorage.getItem("merxiom_token");

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
      localStorage.getItem("merxiom_token");

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
        !businessData.business?.shipping?.pickupAddress ||
        !businessData.business?.shipping?.city ||
        !businessData.business?.shipping?.state
      ) {
        throw new Error(
          "This seller has not completed a verified pickup address."
        );
      }

      const shipping =
        businessData.business.shipping;

      const origin = {
        address: shipping.pickupAddress,
        city: shipping.city,
        state: shipping.state,
        country: shipping.country || "Nigeria",
      };

      const destination = {
        address: form.address,
        city: form.city,
        state: form.state,
        country: "Nigeria",
      };

      const validateResponse = await fetch(
        `${API}/shipping/validate-address`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            country: "Nigeria",
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

      const totalWeight = cart.reduce(
        (total, item) =>
          total +
          Number(item.shipping?.weight || 1) *
            Number(item.quantity || 1),
        0
      );

      const declaredValue = cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 1),
        0
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
            origin,
            destination,
            weightKg: totalWeight,
            declaredValue,
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

      const couriers =
        Array.isArray(ratesData.data?.couriers)
          ? ratesData.data.couriers
          : [];

      if (couriers.length === 0) {
        throw new Error(
          "No delivery options are available for this address."
        );
      }

      setValidatedAddressCode(true);
      setSellerAddressCode(true);
      setShippingRequestToken(
        ratesData.data?.reference || ""
      );

      setRates(couriers);

      const cheapest = couriers.reduce(
        (lowest, courier) =>
          Number(courier.total || 0) <
          Number(lowest.total || 0)
            ? courier
            : lowest,
        couriers[0]
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

    const token =
      localStorage.getItem("merxiom_token");

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

  if (!localStorage.getItem("merxiom_token")) {
    return (
      <>
        <Header />

        <main className="checkout-main">
          <section className="checkout-login-card">
            <p className="eyebrow">
              MERXIOM Checkout
            </p>

            <h1>Sign in to continue</h1>

            <p>
              You need an MERXIOM account to enter
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
              MERXIOM Checkout
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
              MERXIOM Checkout
            </p>

            <h1>Delivery details</h1>

            <p>
              Enter your delivery information and
              MERXIOM will calculate real courier
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
                        <span>MERXIOM</span>
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


const FAVOURITES_KEY = "merxiom_favourites";
const RECENTLY_VIEWED_KEY = "merxiom_recently_viewed";

function getStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function toggleStoredId(key, id) {
  const current = getStoredList(key);
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [id, ...current];

  localStorage.setItem(key, JSON.stringify(next));
  return next;
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

  const [condition, setCondition] =
    useState("All");

  const [locationFilter, setLocationFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("relevance");

  const [filtersOpen, setFiltersOpen] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("mx-menu-open");
    } else {
      document.body.classList.remove("mx-menu-open");
    }

    return () => {
      document.body.classList.remove("mx-menu-open");
    };
  }, [mobileMenuOpen]);

  const [favourites, setFavourites] =
    useState(() => getStoredList(FAVOURITES_KEY));

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
              "MERXIOM Store",
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
    "Phones & Tablets",
    "Electronics",
    "Fashion",
    "Shoes",
    "Beauty",
    "Home & Living",
    "Computers",
    "Accessories",
    "Sports & Fitness",
    "Baby & Kids",
    "Automotive",
    "Services",
  ];

  const filteredProducts =
    products
      .filter((product) => {
        const query = search.trim().toLowerCase();

        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.store,
          product.business?.name,
          product.location,
          product.city
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const searchableWords = searchableText
          .split(/\s+/)
          .map((word) => word.replace(/[^a-z0-9]/g, ""))
          .filter(Boolean);

        const queryWords = query
          .split(/\s+/)
          .map((word) => word.replace(/[^a-z0-9]/g, ""))
          .filter(Boolean);

        function closeEnough(word, target) {
          if (!word || !target) return false;

          if (word.includes(target) || target.includes(word)) {
            return true;
          }

          if (Math.abs(word.length - target.length) > 2) {
            return false;
          }

          const previous = Array.from(
            { length: target.length + 1 },
            (_, index) => index
          );

          for (let i = 1; i <= word.length; i += 1) {
            const current = [i];

            for (let j = 1; j <= target.length; j += 1) {
              const cost = word[i - 1] === target[j - 1] ? 0 : 1;

              current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost
              );
            }

            for (let j = 0; j < current.length; j += 1) {
              previous[j] = current[j];
            }
          }

          return previous[target.length] <= 2;
        }

        const matchesSearch =
          !query ||
          queryWords.every((queryWord) =>
            searchableWords.some((word) =>
              closeEnough(word, queryWord)
            )
          );

        const matchesCategory =
          category === "All" ||
          String(product.category || "").trim().toLowerCase() ===
            category.toLowerCase();

        const productCondition =
          String(
            product.condition ||
            product.productCondition ||
            "New"
          ).trim();

        const matchesCondition =
          condition === "All" ||
          productCondition.toLowerCase() === condition.toLowerCase();

        const productLocation =
          product.city ||
          product.location ||
          product.business?.city ||
          "";

        const matchesLocation =
          locationFilter === "All" ||
          String(productLocation)
            .toLowerCase()
            .includes(locationFilter.toLowerCase());

        return (
          matchesSearch &&
          matchesCategory &&
          matchesCondition &&
          matchesLocation
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-low") {
          return Number(a.price || 0) - Number(b.price || 0);
        }

        if (sortBy === "price-high") {
          return Number(b.price || 0) - Number(a.price || 0);
        }

        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }

        return 0;
      });

  function handleAdd(product) {
    const cart = addItemToCart(product, 1);

    setCartCount(
      cart.reduce(
        (total, item) => total + item.quantity,
        0
      )
    );
  }

  function handleFavourite(product) {
    const id = product.id;
    const next = toggleStoredId(
      FAVOURITES_KEY,
      id
    );

    setFavourites(next);
  }

  function handleProductOpen(product) {
    const current = getStoredList(
      RECENTLY_VIEWED_KEY
    );

    const next = [
      product.id,
      ...current.filter(
        (id) => id !== product.id
      )
    ].slice(0, 12);

    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(next)
    );
  }


  return (
    <>
      <MobileBottomNav cartCount={cartCount} />

      <main className="merxiom-homepage">

      {/* =========================================================
          MERXIOM MARKETPLACE HEADER
      ========================================================= */}
      <header className="mx-header">
        <div className="mx-container mx-header-inner">

          <button
            type="button"
            className="mx-mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <a href="/" className="mx-logo" aria-label="MERXIOM home">
            <img src="/logo.png" alt="MERXIOM" />
          </a>

          <form
            className="mx-search"
            onSubmit={(e) => {
              e.preventDefault();
              const query = e.currentTarget.elements.search?.value.trim();

              if (query) {
                window.location.href = `/search?q=${encodeURIComponent(query)}`;
              }
            }}
          >
            <input
              name="search"
              type="search"
              placeholder="Search for products, brands and more..."
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search">
              Search
            </button>
          </form>

          <div className="mx-header-actions">

            <a
              href={getUserFromStorage() ? "/account" : "/login"}
              className="mx-header-action"
            >
              <span className="mx-action-icon">◯</span>
              <span>
                <small>Hello,</small>
                Account
              </span>
            </a>

            <a href="/orders" className="mx-header-action mx-orders-link">
              <span className="mx-action-icon">▣</span>
              <span>
                <small>Track</small>
                Orders
              </span>
            </a>

            <a href="/cart" className="mx-cart-button" aria-label="Cart">
              <span className="mx-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
                  <circle cx="10" cy="20" r="1.2" />
                  <circle cx="18" cy="20" r="1.2" />
                </svg>
              </span>
              <span>Cart</span>
              <b>0</b>
            </a>

          </div>
        </div>
      </header>

      {/* =========================================================
          MARKETPLACE NAVIGATION
      ========================================================= */}
      <nav className="mx-market-nav">
        <div className="mx-container mx-market-nav-inner">

          <a href="/discover" className="mx-category-trigger">
            Categories
          </a>

          <a href="/deals">Today's Deals</a>
          <a href="/featured">Featured</a>
          <a href="/category/fashion">Fashion</a>
          <a href="/category/electronics">Electronics</a>
          <a href="/category/beauty">Beauty</a>
          <a href="/category/home-living">Home & Living</a>
          <a href="/ai">MERXIOM AI</a>

          <a href="/business" className="mx-sell-link">
            Sell on MERXIOM
          </a>

        </div>
      </nav>

      {/* =========================================================
          HERO / PROMOTIONAL AREA
      ========================================================= */}
      {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="mx-mobile-menu-backdrop"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="mx-mobile-menu-panel">
              <div className="mx-mobile-menu-inner">
              <a href="/discover" onClick={() => setMobileMenuOpen(false)}>Categories</a>
              <a href="/deals" onClick={() => setMobileMenuOpen(false)}>Today's Deals</a>
              <a href="/featured" onClick={() => setMobileMenuOpen(false)}>Featured</a>
              <a href="/category/fashion" onClick={() => setMobileMenuOpen(false)}>Fashion</a>
              <a href="/category/electronics" onClick={() => setMobileMenuOpen(false)}>Electronics</a>
              <a href="/category/beauty" onClick={() => setMobileMenuOpen(false)}>Beauty</a>
              <a href="/category/home-living" onClick={() => setMobileMenuOpen(false)}>Home & Living</a>
              <a href="/ai" onClick={() => setMobileMenuOpen(false)}>✦ MERXIOM AI</a>
              <a href="/business" onClick={() => setMobileMenuOpen(false)}>Sell on MERXIOM</a>
              </div>
            </div>
          </>
        )}

        <section className="mx-hero">
        <div className="mx-container mx-hero-layout">
          <aside className="mx-hero-categories">

            <div className="mx-panel-title">
              <span>SHOP BY CATEGORY</span>
              <a href="/discover">View all</a>
            </div>

            <a href="/category/fashion">
              <span>👗</span>
              Fashion
              <b>›</b>
            </a>

            <a href="/category/electronics">
              <span>📱</span>
              Phones & Electronics
              <b>›</b>
            </a>

            <a href="/category/beauty">
              <span>✨</span>
              Beauty & Personal Care
              <b>›</b>
            </a>

            <a href="/category/home-living">
              <span>🏠</span>
              Home & Living
              <b>›</b>
            </a>

            <a href="/featured">
              <span>👟</span>
              Shoes & Bags
              <b>›</b>
            </a>

            <a href="/featured">
              <span>🎁</span>
              Other Categories
              <b>›</b>
            </a>

          </aside>

          <div className="mx-hero-banner">

            <div className="mx-hero-banner-content">
              <span className="mx-eyebrow">
                MERXIOM MARKETPLACE
              </span>

              <h1>
                Everything you need.
                <br />
                All in one place.
              </h1>

              <p>
                Discover products from Nigerian businesses,
                compare your options and shop with confidence.
              </p>

              <div className="mx-hero-actions">
                <a href="/featured" className="mx-primary-button">
                  Shop now
                </a>

                <a href="/discover" className="mx-secondary-button">
                  Explore categories
                </a>
              </div>
            </div>

            <div className="mx-hero-art" aria-hidden="true">
              <div className="mx-hero-art-circle"></div>
              <div className="mx-hero-art-card mx-hero-art-card-one">
                <span>DISCOVER</span>
                <strong>New finds</strong>
              </div>
              <div className="mx-hero-art-card mx-hero-art-card-two">
                <span>SHOP</span>
                <strong>With confidence</strong>
              </div>
            </div>

          </div>

          <aside className="mx-hero-side">

            <a href="/ai" className="mx-side-promo mx-side-ai">
              <span>MERXIOM AI</span>
              <strong>
                Don't know what to buy?
              </strong>
              <small>
                Let intelligent shopping help you discover.
              </small>
              <b>Ask AI →</b>
            </a>

            <a href="/business" className="mx-side-promo mx-side-seller">
              <span>FOR BUSINESS</span>
              <strong>
                Take your business online.
              </strong>
              <small>
                Create your store and reach more customers.
              </small>
              <b>Start selling →</b>
            </a>

          </aside>

        </div>
      </section>

      {/* =========================================================
          CATEGORY SHORTCUTS
      ========================================================= */}
      <section className="mx-section mx-category-section" id="categories">
        <div className="mx-container">

          <div className="mx-section-heading">
            <div>
              <span className="mx-section-kicker">EXPLORE</span>
              <h2>Shop by category</h2>
            </div>

            <a href="/featured">View all</a>
          </div>

          <div className="mx-category-grid">

            <a href="/category/fashion" className="mx-category-card">
              <div className="mx-category-icon">👗</div>
              <strong>Fashion</strong>
              <span>Clothing & style</span>
            </a>

            <a href="/category/electronics" className="mx-category-card">
              <div className="mx-category-icon">📱</div>
              <strong>Phones & Electronics</strong>
              <span>Tech & gadgets</span>
            </a>

            <a href="/category/beauty" className="mx-category-card">
              <div className="mx-category-icon">✨</div>
              <strong>Beauty</strong>
              <span>Care & beauty</span>
            </a>

            <a href="/category/home-living" className="mx-category-card">
              <div className="mx-category-icon">🏠</div>
              <strong>Home & Living</strong>
              <span>For your space</span>
            </a>

            <a href="/featured" className="mx-category-card">
              <div className="mx-category-icon">👟</div>
              <strong>Shoes & Bags</strong>
              <span>Everyday essentials</span>
            </a>

            <a href="/featured" className="mx-category-card">
              <div className="mx-category-icon">＋</div>
              <strong>More</strong>
              <span>Explore MERXIOM</span>
            </a>

          </div>
        </div>
      </section>

      {/* =========================================================
          DEALS / PROMOTIONAL STRIP
      ========================================================= */}
      <section className="mx-section mx-deals-section" id="deals">
        <div className="mx-container">

          <div className="mx-section-heading">
            <div>
              <span className="mx-section-kicker">DON'T MISS OUT</span>
              <h2>Today's deals</h2>
            </div>

            <a href="/featured">See all deals</a>
          </div>

          <div className="mx-deals-strip">

            <a href="/featured" className="mx-deal-card mx-deal-card-dark">
              <div>
                <span>HOT PICKS</span>
                <strong>Discover something new</strong>
                <small>Fresh products from MERXIOM sellers.</small>
              </div>
              <b>Shop now →</b>
            </a>

            <a href="/featured" className="mx-deal-card mx-deal-card-gold">
              <div>
                <span>SMART SHOPPING</span>
                <strong>More choice. Better discovery.</strong>
                <small>Explore products across categories.</small>
              </div>
              <b>Explore →</b>
            </a>

            <a href="/ai" className="mx-deal-card mx-deal-card-light">
              <div>
                <span>MERXIOM AI</span>
                <strong>Need help deciding?</strong>
                <small>Ask MERXIOM AI what to shop for.</small>
              </div>
              <b>Try AI →</b>
            </a>

          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED PRODUCTS — RESERVED FOR REAL PRODUCTS
      ========================================================= */}
      <section className="mx-section mx-products-section" id="featured">
        <div className="mx-container">

          <div className="mx-section-heading">
            <div>
              <span className="mx-section-kicker">DISCOVER</span>
              <h2>Featured products</h2>
            </div>

            <a href="/discover">View all products</a>
          </div>

          <div className="mx-product-grid">

            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <article className="mx-product-card" key={slot}>

                <div className="mx-product-media">
                  <span>PRODUCT</span>
                </div>

                <div className="mx-product-details">
                  <span className="mx-product-category">
                    Featured
                  </span>

                  <h3>
                    Your next favourite product will appear here
                  </h3>

                  <strong>₦—</strong>

                  <small>
                    MERXIOM marketplace
                  </small>
                </div>

              </article>
            ))}

          </div>

        </div>
      </section>

      {/* =========================================================
          SECOND PRODUCT AREA — FUTURE CATALOGUE
      ========================================================= */}
      <section className="mx-section mx-products-section mx-products-secondary">
        <div className="mx-container">

          <div className="mx-section-heading">
            <div>
              <span className="mx-section-kicker">
                MORE TO EXPLORE
              </span>
              <h2>Popular on MERXIOM</h2>
            </div>

            <a href="/discover">Explore marketplace</a>
          </div>

          <div className="mx-product-grid">

            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <article
                className="mx-product-card"
                key={`popular-${slot}`}
              >
                <div className="mx-product-media">
                  <span>PRODUCT</span>
                </div>

                <div className="mx-product-details">
                  <span className="mx-product-category">
                    Popular
                  </span>

                  <h3>
                    More products from Nigerian businesses
                  </h3>

                  <strong>₦—</strong>

                  <small>
                    Available on MERXIOM
                  </small>
                </div>
              </article>
            ))}

          </div>

        </div>
      </section>

      {/* =========================================================
          CATEGORY PROMOTION
      ========================================================= */}
      <section className="mx-promo-section">
        <div className="mx-container mx-promo-grid">

          <a href="/category/fashion" className="mx-promo-card mx-promo-fashion">
            <span>FASHION</span>
            <h2>Style your way.</h2>
            <p>Discover clothing, shoes and accessories.</p>
            <b>Shop fashion →</b>
          </a>

          <a
            href="/category/electronics"
            className="mx-promo-card mx-promo-electronics"
          >
            <span>ELECTRONICS</span>
            <h2>Upgrade everyday.</h2>
            <p>Find gadgets and technology for your life.</p>
            <b>Explore electronics →</b>
          </a>

        </div>
      </section>

      {/* =========================================================
          MERXIOM AI
      ========================================================= */}
      <section className="mx-ai-section" id="ai">
        <div className="mx-container mx-ai-inner">

          <div className="mx-ai-copy">
            <span className="mx-section-kicker">
              INTELLIGENT COMMERCE
            </span>

            <h2>
              Not sure what to buy?
              <br />
              Ask MERXIOM AI.
            </h2>

            <p>
              Tell us what you need, what you like and what matters
              to you. MERXIOM AI helps turn your idea into a smarter
              shopping journey.
            </p>

            <a href="/ai" className="mx-primary-button">
              Ask MERXIOM AI
            </a>
          </div>

          <div className="mx-ai-visual" aria-hidden="true">
            <div className="mx-ai-orb">M</div>

            <div className="mx-ai-message">
              <span>MERXIOM AI</span>
              <strong>What are you looking for?</strong>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          SELLER CTA
      ========================================================= */}
      <section className="mx-seller-section">
        <div className="mx-container mx-seller-inner">

          <div>
            <span className="mx-section-kicker">
              FOR BUSINESSES
            </span>

            <h2>
              Bring your business to MERXIOM.
            </h2>

            <p>
              Create your store, list your products and reach
              customers through a marketplace built for modern
              commerce.
            </p>
          </div>

          <a href="/business" className="mx-primary-button">
            Start selling
          </a>

        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="mx-footer">
        <div className="mx-container mx-footer-grid">

          <div className="mx-footer-brand">
            <a href="/" className="mx-logo">
              <span className="mx-logo-mark">M</span>
              <span className="mx-logo-word">MERXIOM</span>
            </a>

            <p>
              Where commerce meets intelligent thinking.
            </p>
          </div>

          <div>
            <h3>Shop</h3>
            <a href="/discover">Categories</a>
            <a href="/deals">Today's Deals</a>
            <a href="/featured">Featured</a>
            <a href="/discover">Discover</a>
          </div>

          <div>
            <h3>Business</h3>
            <a href="/business">Sell on MERXIOM</a>
            <a href="/ai">MERXIOM AI</a>
          </div>

          <div>
            <h3>Help</h3>
            <a href="/help">Help centre</a>
            <a href="/account">My account</a>
          </div>

        </div>

        <div className="mx-footer-bottom">
          <div className="mx-container">
            © {new Date().getFullYear()} MERXIOM. All rights reserved.
          </div>
        </div>
      </footer>

    </main>
    <footer className="merxiom-footer">
        <div>
          <img src="/logo.png" alt="MERXIOM" />
          <p>Commerce. Intelligence. Possibility.</p>
        </div>

        <div className="merxiom-footer-links">
          <div>
            <strong>Marketplace</strong>
            <a href="/">Shop</a>
            <a href="/discover">Discover</a>
          </div>

          <div>
            <strong>Business</strong>
            <a href="/business">Sell on MERXIOM</a>
            <a href="/ai">MERXIOM AI</a>
          </div>

          <div>
            <strong>Support</strong>
            <a href="/help">Help centre</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}

const MERXIOM_CATEGORY_MAP = {
  "phones-and-tablets": [
    "phones",
    "mobile phones",
    "smartphones",
    "tablets",
    "mobile",
  ],
  "electronics": [
    "electronics",
    "gadgets",
    "televisions",
    "audio",
    "cameras",
  ],
  "fashion": [
    "fashion",
    "clothing",
    "ankara",
    "gowns",
    "dresses",
    "shirts",
    "trousers",
    "traditional wear",
  ],
  "shoes": [
    "shoes",
    "sneakers",
    "footwear",
    "sandals",
    "slippers",
  ],
  "beauty": [
    "beauty",
    "cosmetics",
    "skincare",
    "hair",
    "makeup",
    "personal care",
  ],
  "home-and-living": [
    "home",
    "furniture",
    "decor",
    "home & living",
    "kitchen",
    "appliances",
  ],
  "computers": [
    "computers",
    "laptops",
    "computer accessories",
    "printers",
    "storage",
  ],
  "accessories": [
    "accessories",
    "bags",
    "watches",
    "jewelry",
    "jewellery",
    "belts",
    "wallets",
  ],
  "sports-and-fitness": [
    "sports",
    "fitness",
    "gym",
    "football",
    "running",
    "outdoor",
  ],
  "baby-and-kids": [
    "baby",
    "kids",
    "children",
    "toys",
    "maternity",
  ],
  "automotive": [
    "automotive",
    "cars",
    "car accessories",
    "motorcycle",
    "auto parts",
  ],
  "services": [
    "services",
    "service",
    "business services",
  ],
};

function CategoryPage({ categorySlug }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [condition, setCondition] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const categoryNames = {
    "phones-and-tablets": "Phones & Tablets",
    "electronics": "Electronics",
    "fashion": "Fashion",
    "shoes": "Shoes",
    "beauty": "Beauty",
    "home-and-living": "Home & Living",
    "computers": "Computers",
    "accessories": "Accessories",
    "sports-and-fitness": "Sports & Fitness",
    "baby-and-kids": "Baby & Kids",
    "automotive": "Automotive",
    "services": "Services",
  };

  const categoryName =
    categoryNames[categorySlug] || "Marketplace";

  const acceptedCategories =
    MERXIOM_CATEGORY_MAP[categorySlug] || [];

  useEffect(() => {
    let cancelled = false;

    async function loadCategoryProducts() {
      try {
        const response = await fetch(`${API}/products`);

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        const matched = list.filter((product) => {
          const productCategory = String(
            product.category || ""
          )
            .trim()
            .toLowerCase();

          return (
            acceptedCategories.includes(productCategory) ||
            acceptedCategories.some(
              (item) =>
                productCategory.includes(item) ||
                item.includes(productCategory)
            )
          );
        });

        if (!cancelled) {
          setProducts(matched);
        }
      } catch (error) {
        console.error("MERXIOM category error:", error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategoryProducts();

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  const visibleProducts = [...products]
    .filter((product) => {
      if (condition === "All") return true;

      const productCondition = String(
        product.condition || ""
      ).toLowerCase();

      return productCondition === condition.toLowerCase();
    })
    .filter((product) => {
      if (locationFilter === "All") return true;

      const productLocation = String(
        product.location ||
          product.business?.location ||
          ""
      ).toLowerCase();

      return productLocation.includes(
        locationFilter.toLowerCase()
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortBy === "price-high") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }

      return 0;
    });

  const goToCategory = (value) => {
    if (!value) return;

    window.location.href = `/category/${value}`;
  };

  return (
    <div className="merxiom-category-page">
      <Header />

      <main className="merxiom-category-page-main">
        <div className="merxiom-category-page-top">
          <button
            type="button"
            className="merxiom-search-back"
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(
                new PopStateEvent("popstate")
              );
            }}
          >
            ← Back to marketplace
          </button>

          <span className="merxiom-section-label">
            CATEGORY
          </span>

          <h1>{categoryName}</h1>

          <p>
            Explore {categoryName.toLowerCase()} from
            businesses and sellers on MERXIOM.
          </p>
        </div>

        <section className="merxiom-category-page-products">
          <div className="merxiom-category-page-heading">
            <div>
              <span className="merxiom-section-label">
                MARKETPLACE
              </span>

              <h2>
                {loading
                  ? "Finding products..."
                  : `${visibleProducts.length} ${
                      visibleProducts.length === 1
                        ? "product"
                        : "products"
                    }`}
              </h2>
            </div>

            <div className="merxiom-category-controls">
              <label>
                <span>Category</span>
                <select
                  value={categorySlug}
                  onChange={(e) =>
                    goToCategory(e.target.value)
                  }
                >
                  <option value="phones-and-tablets">
                    Phones & Tablets
                  </option>
                  <option value="electronics">
                    Electronics
                  </option>
                  <option value="fashion">
                    Fashion
                  </option>
                  <option value="shoes">
                    Shoes
                  </option>
                  <option value="beauty">
                    Beauty
                  </option>
                  <option value="home-and-living">
                    Home & Living
                  </option>
                  <option value="computers">
                    Computers
                  </option>
                  <option value="accessories">
                    Accessories
                  </option>
                  <option value="sports-and-fitness">
                    Sports & Fitness
                  </option>
                  <option value="baby-and-kids">
                    Baby & Kids
                  </option>
                  <option value="automotive">
                    Automotive
                  </option>
                  <option value="services">
                    Services
                  </option>
                </select>
              </label>

              <label>
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                >
                  <option value="relevance">
                    Relevance
                  </option>
                  <option value="newest">
                    Newest
                  </option>
                  <option value="price-low">
                    Price: Low to High
                  </option>
                  <option value="price-high">
                    Price: High to Low
                  </option>
                </select>
              </label>

              <label>
                <span>Condition</span>
                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value)
                  }
                >
                  <option value="All">All</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </label>

              <label>
                <span>Location</span>
                <select
                  value={locationFilter}
                  onChange={(e) =>
                    setLocationFilter(e.target.value)
                  }
                >
                  <option value="All">All locations</option>
                  <option value="Nigeria">Nigeria</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="merxiom-category-empty">
              <p>
                Loading {categoryName.toLowerCase()}...
              </p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="merxiom-category-empty">
              <div className="merxiom-empty-icon">
                ⌕
              </div>

              <h2>No products here yet</h2>

              <p>
                Sellers on MERXIOM haven't listed products
                matching these filters yet.
              </p>

              <a href="/search">
                Search the marketplace →
              </a>
            </div>
          ) : (
            <div className="merxiom-category-products-grid">
              {visibleProducts.map((product) => {
                const image = product.images?.[0]
                  ? product.images[0].startsWith("http")
                    ? product.images[0]
                    : `${API.replace(
                        /\/api\/?$/,
                        ""
                      )}${product.images[0]}`
                  : "";

                const productId =
                  product._id || product.id;

                return (
                  <a
                    key={
                      productId ||
                      product.name
                    }
                    href={
                      productId
                        ? `/product/${productId}`
                        : "#"
                    }
                    className="merxiom-category-product-card"
                  >
                    <div className="merxiom-category-product-media">
                      {image ? (
                        <img
                          src={image}
                          alt={
                            product.name ||
                            "Product"
                          }
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span>MERXIOM</span>
                      )}
                    </div>

                    <div className="merxiom-category-product-content">
                      <span>
                        {product.category ||
                          categoryName}
                      </span>

                      <h3>{product.name}</h3>

                      <p>
                        {product.business?.name ||
                          product.store ||
                          "MERXIOM Store"}
                      </p>

                      <strong>
                        ₦
                        {Number(
                          product.price || 0
                        ).toLocaleString()}
                      </strong>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}

function SearchResultsPage() {
  const getSearchQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  };

  const [query, setQuery] = useState(getSearchQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSearchNavigation = () => {
      setQuery(getSearchQuery());
    };

    window.addEventListener("popstate", handleSearchNavigation);

    return () => {
      window.removeEventListener("popstate", handleSearchNavigation);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(`${API}/products`);

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : (data.products || []);

        if (!cancelled) {
          setProducts(list);
        }
      } catch (error) {
        console.error("MERXIOM search error:", error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }, [query]);

  const queryWords = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  function closeEnough(word, target) {
    if (!word || !target) return false;

    if (word.includes(target) || target.includes(word)) {
      return true;
    }

    if (Math.abs(word.length - target.length) > 2) {
      return false;
    }

    const previous = Array.from(
      { length: target.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= word.length; i += 1) {
      const current = [i];

      for (let j = 1; j <= target.length; j += 1) {
        const cost = word[i - 1] === target[j - 1] ? 0 : 1;

        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
      }

      for (let j = 0; j < current.length; j += 1) {
        previous[j] = current[j];
      }
    }

    return previous[target.length] <= 2;
  }

  const results = products.filter((product) => {
    if (queryWords.length === 0) return true;

    const searchableText = [
      product.name,
      product.description,
      product.category,
      product.store,
      product.business?.name,
      product.city,
      product.location
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchableWords = searchableText
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/g, ""))
      .filter(Boolean);

    return queryWords.every((queryWord) =>
      searchableWords.some((word) =>
        closeEnough(word, queryWord)
      )
    );
  });

  return (
    <div className="merxiom-search-page">
      <Header />

      <main className="merxiom-search-page-main">
        <div className="merxiom-search-page-top">
          <button
            type="button"
            className="merxiom-search-back"
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            ← Back to marketplace
          </button>

          <span className="merxiom-section-label">
            MARKETPLACE SEARCH
          </span>

          <h1>
            Search results for{" "}
            <span>“{query}”</span>
          </h1>

          {!loading && results.length === 0 && (
            <p>
              We couldn't find an exact match, but you can try another
              product, brand or category.
            </p>
          )}
        </div>

        <div className="merxiom-search-page-search">
          <form
            onSubmit={(event) => {
              event.preventDefault();

              const value =
                event.currentTarget.elements.search.value.trim();

              if (!value) return;

              window.history.pushState(
                {},
                "",
                `/search?q=${encodeURIComponent(value)}`
              );

              window.dispatchEvent(
                new PopStateEvent("popstate")
              );
            }}
          >
            <input
              name="search"
              type="search"
              defaultValue={query}
              placeholder="Search products, brands or categories..."
              autoFocus
            />

            <button type="submit">
              Search
            </button>
          </form>
        </div>

          <div className="merxiom-search-page-results">
            <div>
              <strong>
                {loading
                  ? "Searching..."
                  : `${results.length} result${results.length === 1 ? "" : "s"}`}
              </strong>

              <span>
                {loading
                  ? " Finding products across MERXIOM"
                  : " Marketplace products matching your search"}
              </span>
            </div>

            {!loading && results.length === 0 ? (
              <div className="merxiom-search-empty">
                <div className="merxiom-empty-icon">⌕</div>

                <h2>No products found</h2>

                <p>
                  We couldn't find a product matching “{query}”.
                  Try another product, brand or category.
                </p>
              </div>
            ) : (
              <div className="merxiom-search-results-grid">
                {results.map((product) => (
                  <article
                    className="merxiom-search-result-card"
                    key={product._id || product.id || product.name}
                    role="button"
                    tabIndex="0"
                    onClick={() => {
                      const id = product._id || product.id;

                      if (!id) return;

                      window.history.pushState(
                        {},
                        "",
                        `/product/${id}`
                      );

                      window.dispatchEvent(
                        new PopStateEvent("popstate")
                      );
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        const id =
                          product._id || product.id;

                        if (!id) return;

                        window.history.pushState(
                          {},
                          "",
                          `/product/${id}`
                        );

                        window.dispatchEvent(
                          new PopStateEvent("popstate")
                        );
                      }
                    }}
                  >
                    <div className="merxiom-search-result-media">
                      {product.images?.[0] ? (
                        <img
                          src={
                            product.images[0].startsWith("http")
                              ? product.images[0]
                              : `${API.replace(/\/api\/?$/, "")}${product.images[0]}`
                          }
                          alt={product.name || "Product"}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : product.image ? (
                        <img
                          src={product.image}
                          alt={product.name || "Product"}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span>MERXIOM</span>
                      )}
                    </div>

                    <div className="merxiom-search-result-content">
                      <span>
                        {product.category || "Marketplace"}
                      </span>

                      <h3>{product.name}</h3>

                      <p>
                        {product.business?.name ||
                          product.store ||
                          "MERXIOM Store"}
                      </p>

                      <strong>
                        ₦{Number(product.price || 0).toLocaleString()}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function DiscoverPage() {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchScope, setSearchScope] = useState("all");
  const [mobileDiscoverMenuOpen, setMobileDiscoverMenuOpen] = useState(false);
  

  const categories = [
    ["Fashion", "fashion", "Style & expression", "✦"],
    ["Phones & Tablets", "phones-and-tablets", "Stay connected", "◈"],
    ["Electronics", "electronics", "Tech essentials", "⌁"],
    ["Beauty", "beauty", "Care & self", "✧"],
    ["Home & Living", "home-and-living", "Make it yours", "⌂"],
    ["Computers", "computers", "Work & study", "▣"],
    ["Shoes", "shoes", "Step into it", "◇"],
    ["Accessories", "accessories", "Complete the look", "○"],
    ["Sports & Fitness", "sports-and-fitness", "Move better", "△"],
    ["Baby & Kids", "baby-and-kids", "Little essentials", "♡"],
    ["Automotive", "automotive", "On the move", "▱"],
    ["Services", "services", "Get things done", "＋"],
  ];

  const collections = [
    ["Everyday Essentials", "Useful things for work, home, school and everyday life.", "everyday essentials"],
    ["New & Noticed", "Fresh products and newly listed finds worth exploring.", "new arrivals"],
    ["Style Edit", "Fashion, shoes and accessories for your next look.", "fashion"],
    ["Tech Essentials", "Devices and accessories that keep you moving.", "electronics"],
    ["Made for Business", "Products and services that help businesses get more done.", "business"],
    ["Gifts & Occasions", "Thoughtful finds for birthdays, celebrations and special moments.", "gifts"],
  ];

  useEffect(() => {
    let active = true;

    fetch(`${API}/products`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : [];

        setProducts(list);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const productImage = (product) => {
    if (Array.isArray(product?.images) && product.images.length) {
      return product.images[0];
    }

    return product?.image || product?.imageUrl || "/logo.png";
  };

  const formatPrice = (price) => {
    return `₦${Number(price || 0).toLocaleString("en-NG")}`;
  };

  const search = (event) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) return;

    const params = new URLSearchParams({
      q: query,
      scope: searchScope,
    });

    window.location.href = `/search?${params.toString()}`;
  };

  const openCategory = (slug) => {
    window.location.href = `/category/${slug}`;
  };

  const openCollection = (query) => {
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <div className="merxiom-discover-new">

      <header className="discover-new-header">
        <div className="discover-new-header-inner">

          <button
            type="button"
            className="discover-new-menu-button"
            aria-label={mobileDiscoverMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileDiscoverMenuOpen}
            onClick={() => setMobileDiscoverMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a href="/" className="discover-new-brand" aria-label="MERXIOM home">
            <img src="/logo.png" alt="MERXIOM" />
            <span>MERXIOM</span>
          </a>

          <div className="discover-new-header-actions">
            <a href="/account" className="discover-new-account">
              Account
            </a>

            <a href="/cart" className="discover-new-cart" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
                <circle cx="10" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
              </svg>
              <strong>Cart</strong>
            </a>
          </div>

        </div>

        <nav className="discover-new-nav" aria-label="Discover navigation">
          <div className="discover-new-nav-inner">
            <a href="/" className="is-current">Discover</a>
            <a href="/deals">Today's Deals</a>
            <a href="/featured">Featured</a>
            <a href="/ai">MERXIOM AI</a>
            <a href="/business">Sell on MERXIOM</a>
          </div>
        </nav>
      </header>

      {mobileDiscoverMenuOpen && (
        <>
          <button
            type="button"
            className="discover-mobile-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileDiscoverMenuOpen(false)}
          />

          <aside className="discover-mobile-menu" aria-label="MERXIOM menu">
            <div className="discover-mobile-menu-head">
              <strong>MERXIOM</strong>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileDiscoverMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <nav className="discover-mobile-menu-links">
              <a href="/" className="is-current">Discover</a>
              <a href="/deals">Today's Deals</a>
              <a href="/featured">Featured</a>
              <a href="/ai">MERXIOM AI</a>
              <a href="/business">Sell on MERXIOM</a>
              <a href="/account">Account</a>
              <a href="/cart">Cart</a>
            </nav>

            <div className="discover-mobile-menu-section">
              <span>SHOP BY CATEGORY</span>
              {categories.map(([name, slug]) => (
                <a key={slug} href={`/category/${slug}`}>
                  {name}
                </a>
              ))}
            </div>
          </aside>
        </>
      )}

      <main>

        <section className="discover-new-hero">
          <div className="discover-new-hero-inner">

            <div className="discover-new-hero-copy">
              <span className="discover-new-kicker">
                MERXIOM DISCOVER
              </span>

              <h1>
                Find something useful.
                <br />
                <em>Find something unexpected.</em>
              </h1>

              <p>
                Explore products, services and ideas from across the MERXIOM
                marketplace — all in one place.
              </p>

              <div className="discover-new-hero-actions">
                <a href="#explore" className="discover-new-primary">
                  Start exploring
                </a>

                <a href="/ai" className="discover-new-secondary">
                  Ask MERXIOM AI →
                </a>
              </div>
            </div>

            <div className="discover-new-hero-card">
              <span>WHAT ARE YOU LOOKING FOR?</span>

              <strong>
                Something for today, or something you didn't know you needed.
              </strong>

              <a href="#categories">
                Explore categories →
              </a>
            </div>

          </div>
        </section>

        <section className="discover-new-section" id="explore">

          <div className="discover-new-section-heading">
            <div>
              <span className="discover-new-kicker">EXPLORE</span>
              <h2>Shop by interest</h2>
            </div>

            <p>
              Start with what you need, what you love, or simply what catches
              your eye.
            </p>
          </div>

          <div className="discover-interest-grid">

            {categories.slice(0, 8).map(
              ([name, slug, eyebrow, icon], index) => (
                <button
                  type="button"
                  key={slug}
                  className="discover-interest-card"
                  onClick={() => openCategory(slug)}
                >
                  <span className="discover-interest-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="discover-interest-icon">
                    {icon}
                  </span>

                  <span className="discover-interest-content">
                    <small>{eyebrow}</small>
                    <strong>{name}</strong>
                    <span>Explore →</span>
                  </span>
                </button>
              )
            )}

          </div>
        </section>

        {products.length > 0 && (
          <section className="discover-new-section discover-products-section">

            <div className="discover-new-section-heading">
              <div>
                <span className="discover-new-kicker">ON MERXIOM</span>
                <h2>Trending now</h2>
              </div>

              <a href="/featured" className="discover-view-all">
                View all →
              </a>
            </div>

            <div className="discover-product-rail">

              {products.slice(0, 8).map((product) => (
                <a
                  href={`/product/${product._id || product.id}`}
                  className="discover-product-card"
                  key={product._id || product.id}
                >
                  <div className="discover-product-image">
                    <img
                      src={productImage(product)}
                      alt={product.name || "MERXIOM product"}
                      loading="lazy"
                    />
                  </div>

                  <div className="discover-product-info">
                    <span>
                      {product.category || "Marketplace"}
                    </span>

                    <strong>
                      {product.name || "Product"}
                    </strong>

                    <b>
                      {formatPrice(product.price)}
                    </b>
                  </div>
                </a>
              ))}

            </div>
          </section>
        )}

        <section className="discover-new-section">

          <div className="discover-new-section-heading">
            <div>
              <span className="discover-new-kicker">
                CURATED FOR YOU
              </span>

              <h2>Explore collections</h2>
            </div>

            <p>
              More than categories. Places to start shopping.
            </p>
          </div>

          <div className="discover-collection-grid">

            {collections.map(([title, text, query], index) => (
              <button
                type="button"
                key={title}
                className="discover-collection-card"
                onClick={() => openCollection(query)}
              >
                <span className="discover-collection-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span>Explore collection →</span>
                </div>
              </button>
            ))}

          </div>
        </section>

        <section className="discover-ai-section">

          <div className="discover-ai-copy">
            <span className="discover-new-kicker">
              MERXIOM INTELLIGENCE
            </span>

            <h2>
              Not sure what you're looking for?
            </h2>

            <p>
              Tell MERXIOM what you need and let intelligent discovery help
              you find the right products, services or ideas.
            </p>

            <a href="/ai">
              Ask MERXIOM AI →
            </a>
          </div>

          <div className="discover-ai-example">
            <span>TRY SOMETHING LIKE</span>

            <p>
              “I need an outfit for a wedding under ₦80,000.”
            </p>

            <small>
              MERXIOM AI can help you explore the possibilities.
            </small>
          </div>

        </section>

        <section
          className="discover-new-section discover-all-categories"
          id="categories"
        >

          <div className="discover-new-section-heading">
            <div>
              <span className="discover-new-kicker">
                THE FULL MARKETPLACE
              </span>

              <h2>Browse all categories</h2>
            </div>

            <p>
              Everything available across MERXIOM, organized simply.
            </p>
          </div>

          <div className="discover-all-category-list">

            {categories.map(([name, slug, , icon]) => (
              <button
                type="button"
                key={slug}
                onClick={() => openCategory(slug)}
              >
                <span>{icon}</span>
                <strong>{name}</strong>
                <em>→</em>
              </button>
            ))}

          </div>
        </section>

      </main>

      <footer className="discover-new-footer">

        <div className="discover-new-footer-inner">

          <div>
            <strong>MERXIOM</strong>
            <p>
              Where commerce meets intelligent thinking.
            </p>
          </div>

          <div>
            <span>Marketplace</span>
            <a href="/">Home</a>
            <a href="/deals">Today's Deals</a>
            <a href="/featured">Featured</a>
          </div>

          <div>
            <span>Help</span>
            <a href="/help">Help Centre</a>
            <a href="/account">My Account</a>
            <a href="/cart">Cart</a>
          </div>

          <div>
            <span>Business</span>
            <a href="/business">Sell on MERXIOM</a>
            <a href="/ai">MERXIOM AI</a>
          </div>

        </div>

        <div className="discover-new-footer-bottom">
          © {new Date().getFullYear()} MERXIOM. All rights reserved.
        </div>

      </footer>

      <MobileBottomNav />

    </div>
  );
}
function MarketplaceListingPage({ title, subtitle, mode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/products`
        );

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        if (!cancelled) {
          setProducts(list);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      )
    ),
  ];

  let visibleProducts = [...products];

  if (category !== "All") {
    visibleProducts = visibleProducts.filter(
      (product) =>
        String(product.category || "").toLowerCase() ===
        category.toLowerCase()
    );
  }

  if (mode === "deals") {
    visibleProducts = visibleProducts.filter(
      (product) =>
        product.status !== "draft" &&
        Number(product.price || 0) > 0
    );
  }

  if (sortBy === "price-low") {
    visibleProducts.sort(
      (a, b) => Number(a.price || 0) - Number(b.price || 0)
    );
  }

  if (sortBy === "price-high") {
    visibleProducts.sort(
      (a, b) => Number(b.price || 0) - Number(a.price || 0)
    );
  }

  if (sortBy === "name") {
    visibleProducts.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  return (
    <>
      <MobileBottomNav />

      <div className="mx-page">
        <header className="mx-page-header">
          <div className="mx-container">
            <div className="mx-page-header-top">
              <a href="/" className="mx-page-back">
                ← MERXIOM
              </a>
              <a href="/cart" className="mx-page-cart">
                🛒 Cart
              </a>
            </div>

            <p className="mx-page-kicker">MARKETPLACE</p>
            <h1>{title}</h1>
            <p className="mx-page-subtitle">{subtitle}</p>
          </div>
        </header>

        <main className="mx-container mx-listing-main">
          <div className="mx-listing-toolbar">
            <div>
              <strong>
                {loading ? "Loading products..." : `${visibleProducts.length} products`}
              </strong>
            </div>

            <div className="mx-listing-controls">
              <label>
                <span>Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="mx-listing-empty">
              <p>Loading products...</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="mx-listing-empty">
              <h2>No products here yet</h2>
              <p>
                New products will appear here as businesses list them on
                MERXIOM.
              </p>
              <a href="/discover">Explore the marketplace</a>
            </div>
          ) : (
            <div className="mx-listing-grid">
              {visibleProducts.map((product) => {
                const image =
                  Array.isArray(product.images) && product.images.length
                    ? product.images[0]
                    : "/logo.png";

                return (
                  <a
                    href={`/product/${product._id || product.id}`}
                    className="mx-listing-card"
                    key={product._id || product.id || product.name}
                  >
                    <div className="mx-listing-image-wrap">
                      <img
                        src={image}
                        alt={product.name || "MERXIOM product"}
                        loading="lazy"
                      />
                      {mode === "deals" && (
                        <span className="mx-deal-badge">DEAL</span>
                      )}
                    </div>

                    <div className="mx-listing-card-body">
                      <h2>{product.name || "Product"}</h2>

                      <p className="mx-listing-price">
                        ₦{Number(product.price || 0).toLocaleString()}
                      </p>

                      {product.category && (
                        <p className="mx-listing-category">
                          {product.category}
                        </p>
                      )}

                      {product.business?.name && (
                        <p className="mx-listing-seller">
                          Sold by {product.business.name}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function DealsPage() {
  return (
    <MarketplaceListingPage
      title="Today's Deals"
      subtitle="Discover products and offers available across the MERXIOM marketplace."
      mode="deals"
    />
  );
}

function FeaturedPage() {
  return (
    <MarketplaceListingPage
      title="Featured Products"
      subtitle="Explore products selected from businesses selling across MERXIOM."
      mode="featured"
    />
  );
}

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [merxiomLoading, setMerxiomLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMerxiomLoading(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, []);

  if (merxiomLoading) {
    return (
      <div className="merxiom-loading-screen" aria-label="Loading MERXIOM">
        <img
          src="/logo.png"
          alt="MERXIOM"
          className="merxiom-loading-logo"
        />
        <div className="merxiom-loading-line" />
        <div className="merxiom-loading-text">Where commerce meets intelligent thinking.</div>
      </div>
    );
  }

  if (pathname === "/discover") {
    return <DiscoverPage />;
  }

  if (pathname === "/deals") {
    return <DealsPage />;
  }

  if (pathname === "/featured") {
    return <FeaturedPage />;
  }

  if (pathname === "/ai") {
    return <MERXIOMAI />;
  }

  if (pathname === "/search") {
    return <SearchResultsPage />;
  }

  const categoryMatch =
    pathname.match(/^\/category\/([^/]+)$/);

  if (categoryMatch) {
    return (
      <CategoryPage
        categorySlug={decodeURIComponent(categoryMatch[1])}
      />
    );
  }

  const storefrontMatch = pathname.match(/^\/store\/([^/]+)$/);
  if (storefrontMatch) {
    return <StorefrontPage storeSlug={decodeURIComponent(storefrontMatch[1])} />;
  }

  if (pathname === "/help") {
    return (
      <>
        <HelpPage />
        <MERXIOMAI />
        <MERXIOMWhatsApp />
        <MERXIOMInstallPrompt />
      </>
    );
  }

  const path =
    pathname;

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
    return (
      <>
        <Header />
        <BusinessDashboard />
        <MobileBottomNav />
      </>
    );
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

  if (path === "/settings") {
    return <SettingsPage />;
  }

  return (
    <>
      <Market />
      <MERXIOMWhatsApp />
      <MERXIOMInstallPrompt />
    </>
  );
}

export default App;
