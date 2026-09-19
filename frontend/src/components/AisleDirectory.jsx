export default function AisleDirectory({ aisles }) {
  if (!aisles || aisles.length === 0) return null;

  return (
    <section className="input-panel aisle-directory">
      <h2>Store directory</h2>
      <p className="subtitle small">Browse what's in each aisle before you shop.</p>
      <div className="aisle-list">
        {aisles.map((aisle) => (
          <details key={aisle.aisle_id}>
            <summary>
              <span className="aisle-badge">A{aisle.aisle_id}</span>
              {aisle.category}
              <span className="item-count">{aisle.items.length} items</span>
            </summary>
            <ul className="aisle-items">
              {aisle.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
