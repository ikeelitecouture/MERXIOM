import React from "react";

const faqs = [
  {
    q: "How do I create a MERXIOM account?",
    a: "Choose Sign up, enter your name, email and password, then select whether you are joining as a customer or seller. Customers can shop, while sellers can create and manage a business store."
  },
  {
    q: "How do I order a product on MERXIOM?",
    a: "Browse or search for a product, open its product page, add it to your cart, review your delivery details and shipping option, then complete checkout and payment."
  },
  {
    q: "How do I sell on MERXIOM?",
    a: "Create an account as a seller, open your business dashboard, create your store, add products and manage your orders from the seller dashboard."
  },
  {
    q: "How can I track my MERXIOM order?",
    a: "When an order has been shipped through MERXIOM's delivery system, available courier and tracking information can be viewed from your account."
  },
  {
    q: "How does MERXIOM shipping work?",
    a: "MERXIOM uses available delivery services to calculate shipping options based on the seller, customer and package details. Shipping is shown separately during checkout."
  },
  {
    q: "What is MERXIOM's platform commission?",
    a: "MERXIOM currently applies a 7.5% platform commission to the product subtotal on marketplace orders. Shipping charges are separate from the platform commission."
  },
  {
    q: "Can businesses create their own stores?",
    a: "Yes. Sellers can create a business store, add products, manage inventory and view their orders through the MERXIOM business dashboard."
  },
  {
    q: "What products can I find on MERXIOM?",
    a: "MERXIOM is designed for multiple product categories. Categories can grow as sellers add products to the marketplace."
  }
];

export default function HelpPage() {
  return (
    <main className="help-page">
      <section className="help-hero">
        <p className="help-eyebrow">MERXIOM HELP CENTER</p>
        <h1>How can we help?</h1>
        <p>
          Find answers about shopping, selling, orders, delivery and
          managing your MERXIOM account.
        </p>
      </section>

      <section className="help-faq">
        {faqs.map((faq) => (
          <article className="help-item" key={faq.q}>
            <h2>{faq.q}</h2>
            <p>{faq.a}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
