import { useEffect, useRef, useState } from "react";

const NUM_AISLES = 8;
const FRONT_Y = 0;
const BACK_Y = 10;
const SHELF_INSET = 0.55;
const LANE_W = 0.4;

// Backend coordinates put the entrance at y=0. Flip vertically so the
// entrance sits at the bottom of the map, the way a floor plan is read.
const fy = (y) => BACK_Y - y;

// Stops only carry their own coordinates, so a straight polyline between
// them would cut through shelving. Walk via whichever cross-corridor
// (front or back) is shorter, matching the store graph's topology.
function corridorPoints(stops) {
  if (!stops.length) return [];
  const pts = [[stops[0].x, stops[0].y]];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (a.x !== b.x) {
      const viaFront = a.y - FRONT_Y + (b.y - FRONT_Y);
      const viaBack = BACK_Y - a.y + (BACK_Y - b.y);
      const cy = viaFront <= viaBack ? FRONT_Y : BACK_Y;
      if (a.y !== cy) pts.push([a.x, cy]);
      if (b.y !== cy) pts.push([b.x, cy]);
    }
    pts.push([b.x, b.y]);
  }
  return pts;
}

// Stretch the floor plan horizontally when there's room so it fills a
// wide card, and keep it compact on phones so labels stay legible.
function useHorizontalScale(ref) {
  const [sx, setSx] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSx(w >= 720 ? 1.75 : w >= 520 ? 1.35 : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return sx;
}

export default function StoreMap({ aisles, route, loading }) {
  const wrapRef = useRef(null);
  const sx = useHorizontalScale(wrapRef);
  const fx = (x) => x * sx;

  const categoryByAisle = Object.fromEntries((aisles || []).map((a) => [a.aisle_id, a.category]));
  const visited = new Set(route ? route.stops.filter((s) => s.type === "shelf").map((s) => s.aisle_id) : []);
  const stepByNode = route ? Object.fromEntries(route.order.map((n, i) => [n, i + 1])) : {};
  const points = route
    ? corridorPoints(route.stops)
        .map(([x, y]) => `${fx(x)},${fy(y)}`)
        .join(" ")
    : "";
  const entrance = route?.stops.find((s) => s.type === "entrance") ?? { x: -1, y: 0 };
  const checkout = route?.stops.find((s) => s.type === "checkout") ?? { x: NUM_AISLES + 1, y: 0 };
  const aisleIds = Array.from({ length: NUM_AISLES }, (_, i) => i + 1);

  // Bounds: endpoints plus room for their labels.
  const minX = fx(entrance.x) - 0.85;
  const maxX = fx(checkout.x) + 0.85;
  const floor = { x: minX, y: -0.75, w: maxX - minX, h: BACK_Y + 2.05 };
  const pad = 0.25;
  const viewBox = `${floor.x - pad} ${floor.y - pad} ${floor.w + pad * 2} ${floor.h + pad * 2}`;
  const shelfGap = LANE_W / 2 + 0.12;

  return (
    <div ref={wrapRef} className={`map${loading ? " map--loading" : ""}`}>
      <svg
        className="map__svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          route
            ? `Store map showing a route through ${route.order.length} stop${route.order.length === 1 ? "" : "s"}`
            : "Store map with 8 aisles between the entrance and checkout"
        }
      >
        <rect className="map__floor" x={floor.x} y={floor.y} width={floor.w} height={floor.h} rx={0.35} />

        {/* Shelving units sit between walkways */}
        {Array.from({ length: NUM_AISLES + 1 }, (_, i) => (
          <rect
            key={`shelf-${i}`}
            className="map__shelf"
            x={fx(i) + shelfGap}
            y={SHELF_INSET}
            width={Math.max(fx(1) - shelfGap * 2, 0.3)}
            height={BACK_Y - SHELF_INSET * 2}
            rx={0.08}
          />
        ))}

        {/* Aisle walkways */}
        {aisleIds.map((i) => (
          <g key={`aisle-${i}`} className={`map__aisle${visited.has(i) ? " map__aisle--visited" : ""}`}>
            <rect
              x={fx(i) - LANE_W / 2}
              y={SHELF_INSET}
              width={LANE_W}
              height={BACK_Y - SHELF_INSET * 2}
              rx={LANE_W / 2}
              className="map__lane"
            />
            <text x={fx(i)} y={-0.28} className="map__aisle-label" textAnchor="middle">
              {i}
            </text>
            <rect x={fx(i) - fx(0.45)} y={-0.75} width={fx(0.9)} height={BACK_Y + 1} fill="transparent">
              <title>{`Aisle ${i}: ${categoryByAisle[i] || "Unknown"}`}</title>
            </rect>
          </g>
        ))}

        {/* Front and back corridors */}
        <line className="map__corridor" x1={fx(entrance.x)} y1={fy(FRONT_Y)} x2={fx(checkout.x)} y2={fy(FRONT_Y)} />
        <line className="map__corridor" x1={fx(1)} y1={fy(BACK_Y)} x2={fx(NUM_AISLES)} y2={fy(BACK_Y)} />

        {route && <polyline key={route.order.join("|")} points={points} className="map__path" pathLength="1" />}

        {/* Entrance and checkout */}
        {[
          { stop: entrance, label: "Entrance", cls: "" },
          { stop: checkout, label: "Checkout", cls: " map__endpoint--checkout" },
        ].map(({ stop, label, cls }) => (
          <g key={label} className={`map__endpoint${cls}`}>
            <rect x={fx(stop.x) - 0.32} y={fy(stop.y) - 0.32} width={0.64} height={0.64} rx={0.14} />
            <text x={fx(stop.x)} y={fy(stop.y) + 0.9} textAnchor="middle" className="map__endpoint-label">
              {label}
            </text>
          </g>
        ))}

        {/* Numbered stops */}
        {route &&
          route.stops
            .filter((s) => s.type === "shelf")
            .map((s) => (
              <g key={s.node} className="map__stop">
                <circle cx={fx(s.x)} cy={fy(s.y)} r={0.3} />
                <text x={fx(s.x)} y={fy(s.y)} dy="0.11" textAnchor="middle">
                  {stepByNode[s.node]}
                </text>
                <title>{`Stop ${stepByNode[s.node]}: aisle ${s.aisle_id}, ${categoryByAisle[s.aisle_id] || "Unknown"}`}</title>
              </g>
            ))}
      </svg>

      {loading && (
        <div className="map__overlay" role="status">
          <span className="spinner spinner--brand" aria-hidden="true" />
          Finding the shortest path
        </div>
      )}
    </div>
  );
}
