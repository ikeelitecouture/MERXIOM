from pathlib import Path

p = Path("src/App.jsx")
s = p.read_text()

old = '''  useEffect(() => {
    setCart(getStoredCart());
  }, []);'''

new = '''  useEffect(() => {
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
  }, []);'''

if old not in s:
    raise SystemExit("Target useEffect not found.")

p.write_text(s.replace(old, new, 1))
print("Paystack callback verification added successfully.")
