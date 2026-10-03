function ProductPage({ product, onBack, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="product-page">
      <button className="back-button" onClick={onBack}>
        ← Back to shop
      </button>

      <div className="product-page-grid">
        <div className="product-page-image">
          <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
        </div>

        <div className="product-page-info">
          <p className="eyebrow">{product.category}</p>

          <h1>{product.name}</h1>

          <div className="product-trust-panel">
            <div className="product-trust-seller">
              <div>
                <span className="product-trust-label">SELLER</span>
                <strong>{product.store || "MERXIOM Store"}</strong>
              </div>

              {(product.business?.verified ||
                product.business?.isVerified ||
                product.seller?.verified ||
                product.seller?.isVerified) && (
                <span className="seller-verified-badge">
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="product-trust-details">
              <span>
                Condition:{" "}
                <strong>
                  {product.condition ||
                    product.productCondition ||
                    "New"}
                </strong>
              </span>

              <span>
                Location:{" "}
                <strong>
                  {product.city ||
                    product.location ||
                    product.business?.city ||
                    "Nigeria"}
                </strong>
              </span>

              <span>
                Stock:{" "}
                <strong>
                  {Number(product.stock || 0) > 0
                    ? `${product.stock} available`
                    : "Currently unavailable"}
                </strong>
              </span>
            </div>

            {(product.business?.slug || product.storeSlug) && (
              <a
                href={`/store/${encodeURIComponent(
                  product.business?.slug || product.storeSlug
                )}`}
                className="product-store-link"
              >
                Visit seller store →
              </a>
            )}
          </div>

          <div className="product-page-price">
            ₦{product.price.toLocaleString()}
          </div>

          <p className="product-page-description">
            Discover this product on MERXIOM. Shop directly from the
            seller and enjoy a simple, modern shopping experience.
          </p>

          <button
            className="product-page-cart"
            onClick={() => onAddToCart(product)}
          >
            Add to cart
          </button>

          <section className="product-reviews">
            <div className="product-reviews-heading">
              <div>
                <span className="product-trust-label">CUSTOMER REVIEWS</span>
                <h2>What buyers say</h2>
              </div>

              <div className="product-rating-summary">
                <strong>
                  {Number(product.rating || product.averageRating || 0).toFixed(1)}
                </strong>
                <span>★</span>
                <small>
                  {Array.isArray(product.reviews)
                    ? `${product.reviews.length} review${product.reviews.length === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </small>
              </div>
            </div>

            {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
              <div className="product-review-list">
                {product.reviews.map((review, index) => (
                  <article
                    className="product-review"
                    key={review._id || review.id || index}
                  >
                    <div className="product-review-top">
                      <strong>
                        {review.user?.name ||
                          review.userName ||
                          review.name ||
                          "MERXIOM Buyer"}
                      </strong>

                      {review.verifiedPurchase && (
                        <span className="verified-purchase-badge">
                          ✓ Verified purchase
                        </span>
                      )}
                    </div>

                    <div className="product-review-stars">
                      {"★".repeat(
                        Math.max(0, Math.min(5, Number(review.rating || 0)))
                      )}
                      <span>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    <p>{review.comment || review.text || ""}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="product-reviews-empty">
                <div className="product-reviews-empty-icon">★</div>
                <h3>No reviews yet</h3>
                <p>
                  Be among the first buyers to share your experience with this
                  product.
                </p>
              </div>
            )}
          </section>

          <div className="product-page-meta">
            <div>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>

            <div>
              <span>Store</span>
              <strong>{product.store}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
