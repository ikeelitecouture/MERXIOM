import { useEffect, useRef, useState } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function MERXIOMAI() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  const getToken = () =>
    localStorage.getItem("merxiom_token");

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  };

  const loadConversations = async () => {
    const token = getToken();

    if (!token) return;

    try {
      setLoadingHistory(true);

      const response = await fetch(
        `${API}/ai/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error(
        "MERXIOM conversation history error:",
        error
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (id) => {
    const token = getToken();

    if (!token) return;

    try {
      const response = await fetch(
        `${API}/ai/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConversationId(data.conversation._id);
        setMessages(
          (data.conversation.messages || []).map(
            (message) => ({
              role: message.role,
              content: message.content,
            })
          )
        );

        scrollToBottom();
      }
    } catch (error) {
      console.error(
        "MERXIOM conversation load error:",
        error
      );
    }
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const token = getToken();

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Please sign in to use MERXIOM AI and save your conversations.",
        },
      ]);
      return;
    }

    setInput("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);
    scrollToBottom();

    try {
      const response = await fetch(
        `${API}/ai/shopping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
            conversationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "MERXIOM AI could not respond."
        );
      }

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.message,
        },
      ]);

      await loadConversations();
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error.message ||
            "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!getToken()) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="merxiom-ai-float"
        onClick={() => setOpen(true)}
        aria-label="Open MERXIOM AI"
      >
        ✦
      </button>

      {open && (
        <div className="merxiom-ai-overlay">
          <section className="merxiom-ai-panel">
            <header className="merxiom-ai-header">
              <div>
                <strong>MERXIOM AI</strong>
                <span>Your intelligent shopping assistant</span>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close MERXIOM AI"
              >
                ×
              </button>
            </header>

            <div className="merxiom-ai-layout">
              <aside className="merxiom-ai-history">
                <button
                  type="button"
                  onClick={startNewChat}
                >
                  + New chat
                </button>

                {loadingHistory ? (
                  <p>Loading chats...</p>
                ) : conversations.length === 0 ? (
                  <p>No previous chats yet.</p>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      type="button"
                      key={conversation._id}
                      className={
                        conversation._id ===
                        conversationId
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        loadConversation(
                          conversation._id
                        )
                      }
                    >
                      {conversation.title ||
                        "Conversation"}
                    </button>
                  ))
                )}
              </aside>

              <main className="merxiom-ai-chat">
                <div className="merxiom-ai-messages">
                  {messages.length === 0 && (
                    <div className="merxiom-ai-welcome">
                      <h2>How can I help?</h2>
                      <p>
                        Ask me about products,
                        shopping, orders or anything
                        about MERXIOM.
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`merxiom-ai-message ${message.role}`}
                    >
                      {message.content}
                    </div>
                  ))}

                  {loading && (
                    <div className="merxiom-ai-message assistant">
                      MERXIOM AI is thinking...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  className="merxiom-ai-input"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    placeholder="Ask MERXIOM AI..."
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={
                      loading || !input.trim()
                    }
                  >
                    Send
                  </button>
                </form>
              </main>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
