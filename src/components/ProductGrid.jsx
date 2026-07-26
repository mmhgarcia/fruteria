import ProductCard from './ProductCard'
import './ProductGrid.css'

function ProductGrid({
  products,
  cart,
  currentFilter,
  onFilterChange,
  onSelectProduct,
  tasa,
  categories = [],
}) {
  const filters = [
    { id: 'todos', label: '🍎 Todos' },
    ...categories
      .map((c) => ({ id: c.id, label: `${c.icon} ${c.name}` }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]

  return (
    <section className="left-panel">
      <div className="filter-bar">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${currentFilter === f.id ? 'active' : ''}`}
            onClick={() => onFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">🔍</div>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartItem={cart.find((item) => item.id === product.id)}
              tasa={tasa}
              onSelect={() => onSelectProduct(product)}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default ProductGrid
