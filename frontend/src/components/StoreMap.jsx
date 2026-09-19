const NUM_AISLES = 8;
const FRONT_Y = 0;
const BACK_Y = 10;

export default function StoreMap({ aisles, route }) {
  const categoryByAisle = Object.fromEntries((aisles || []).map((a) => [a.aisle_id, a.category]));
  const stopByNode = route ? Object.fromEntries(route.stops.map((s) => [s.node, s])) : {};
  const pathPoints = route ? route.stops.map((s) => `${s.x},${s.y}`).join(" ") : "";

  return (
    <svg className="store-map" viewBox="-2 -1 14 13" preserveAspectRatio="xMidYMid meet">
      <style>{`
        .aisle { stroke: #2a2e38; stroke-width: 0.15; }
        .aisle-hit { stroke: transparent; stroke-width: 0.8; cursor: default; }
        .corridor { stroke: #1c2028; stroke-width: 0.1; }
        .path { stroke: #5eead4; stroke-width: 0.18; fill: none; }
        .node-entrance { fill: #5eead4; }
        .node-checkout { fill: #f87171; }
        .node-stop { fill: #fbbf24; }
        .label { fill: #9aa0ab; font-size: 0.4px; }
        .entrance-label, .checkout-label { fill: #6b7280; font-size: 0.32px; }
      `}</style>

      {Array.from({ length: NUM_AISLES }, (_, i) => i + 1).map((i) => (
        <g key={`aisle-${i}`}>
          <line x1={i} y1={FRONT_Y} x2={i} y2={BACK_Y} className="aisle" />
          <line x1={i} y1={FRONT_Y} x2={i} y2={BACK_Y} className="aisle-hit">
            <title>{`Aisle ${i} — ${categoryByAisle[i] || "Unknown"}`}</title>
          </line>
          <text x={i - 0.15} y={BACK_Y + 0.6} className="label">
            {`A${i}`}
            <title>{categoryByAisle[i] || "Unknown"}</title>
          </text>
        </g>
      ))}

      <line x1={1} y1={FRONT_Y} x2={NUM_AISLES} y2={FRONT_Y} className="corridor" />
      <line x1={1} y1={BACK_Y} x2={NUM_AISLES} y2={BACK_Y} className="corridor" />
      <text x={-1.5} y={-0.3} className="entrance-label">Entrance</text>
      <text x={NUM_AISLES + 0.4} y={-0.3} className="checkout-label">Checkout</text>

      {route && <polyline points={pathPoints} className="path" />}

      {route &&
        route.stops.map((s) => {
          const cls =
            s.type === "entrance" ? "node-entrance" : s.type === "checkout" ? "node-checkout" : "node-stop";
          const title =
            s.type === "shelf" ? `Aisle ${s.aisle_id} — ${categoryByAisle[s.aisle_id] || "Unknown"}` : s.type;
          return (
            <circle key={s.node} cx={s.x} cy={s.y} r={0.22} className={cls}>
              <title>{title}</title>
            </circle>
          );
        })}

      {route &&
        route.order.map((node, idx) => {
          const stop = stopByNode[node];
          if (!stop) return null;
          return (
            <text key={node} x={stop.x + 0.3} y={stop.y + 0.15} className="label">
              {idx + 1}
            </text>
          );
        })}
    </svg>
  );
}
