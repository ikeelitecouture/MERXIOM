function ProductPage({ product, onBack, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="product-page">
      <button className="back-button" onClick={onBack}>
        ← Back to shop
      </button>

      <div className="product-page-grid">
        <div className="product-page-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-page-info">
          <p className="eyebrow">{product.category}</p>

          <h1>{product.name}</h1>

          <p className="product-page-store">
            Sold by {product.store}
          </p>

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
