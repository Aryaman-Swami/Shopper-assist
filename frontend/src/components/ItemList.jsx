export function itemStatuses(result) {
  const outOfStock = new Map((result.out_of_stock ?? []).map((o) => [o.query, o]));
  const located = new Map();
  result.route.order.forEach((node, idx) => {
    const stop = result.route.stops.find((s) => s.node === node);
    for (const item of result.route.items_by_stop[node] || []) {
      located.set(item.query, { product: item.name, aisle: stop?.aisle_id, step: idx + 1 });
    }
  });

  return result.extracted_items.map((item) => {
    const qty = `${item.qty ?? 1}${item.unit ? ` ${item.unit}` : ""}`;
    if (located.has(item.name)) return { ...item, qty, status: "found", ...located.get(item.name) };
    if (outOfStock.has(item.name)) {
      const o = outOfStock.get(item.name);
      return { ...item, qty, status: "oos", product: o.name };
    }
    // Anything not routed and not out of stock had no confident catalog match.
    return { ...item, qty, status: "unmatched" };
  });
}

const STATUS_TEXT = {
  oos: "Out of stock",
  unmatched: "Not in catalog",
};

export default function ItemList({ items }) {
  return (
    <section className="card" aria-labelledby="items-title">
      <div className="card__head">
        <h2 id="items-title" className="card__title">
          Your list
        </h2>
      </div>
      <ul className="item-list">
        {items.map((item, i) => (
          <li key={i} className={`item item--${item.status}`}>
            <span className="item__qty">{item.qty}</span>
            <div className="item__main">
              <span className="item__name">{item.name}</span>
              {item.product && item.product.toLowerCase() !== item.name.toLowerCase() && (
                <span className="item__product">
                  {item.status === "oos" ? "Matched " : "Picking up "}
                  {item.product}
                </span>
              )}
            </div>
            {item.status === "found" ? (
              <span className="tag tag--found">
                Stop {item.step} · Aisle {item.aisle}
              </span>
            ) : (
              <span className={`tag tag--${item.status}`}>{STATUS_TEXT[item.status]}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
