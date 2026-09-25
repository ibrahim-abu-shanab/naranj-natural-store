export default function Loading() {
  return (
    <div className="container section" aria-busy="true">
      <div className="skeleton" style={{ height: 60, marginBottom: 30 }} />
      <div className="product-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}
