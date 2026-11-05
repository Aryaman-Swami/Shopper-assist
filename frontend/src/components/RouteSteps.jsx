import { BagIcon, DoorIcon } from "./Icons.jsx";

export default function RouteSteps({ route, categoryByAisle }) {
  const stops = route.stops.filter((s) => s.type === "shelf");
  // Neighbouring stops in the same aisle read better grouped as one step.
  const sameAisleAsPrev = (i) => i > 0 && stops[i - 1].aisle_id === stops[i].aisle_id;

  return (
    <section className="card" aria-labelledby="steps-title">
      <div className="card__head">
        <h2 id="steps-title" className="card__title">
          Walking directions
        </h2>
      </div>

      <ol className="timeline">
        <li className="timeline__item timeline__item--endpoint">
          <span className="timeline__marker">
            <DoorIcon size={14} />
          </span>
          <div className="timeline__body">
            <div className="timeline__label">Start at the entrance</div>
          </div>
        </li>

        {stops.map((stop, i) => {
          const items = route.items_by_stop[stop.node] || [];
          return (
            <li key={stop.node} className="timeline__item">
              <span className="timeline__marker timeline__marker--stop">{route.order.indexOf(stop.node) + 1}</span>
              <div className="timeline__body">
                <div className="timeline__label">
                  {sameAisleAsPrev(i) ? "Continue along " : ""}Aisle {stop.aisle_id}
                  <span className="timeline__cat">{categoryByAisle[stop.aisle_id] || "Unknown section"}</span>
                </div>
                {items.length > 0 && (
                  <ul className="chips">
                    {items.map((item) => (
                      <li key={item.sku} className="chip">
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}

        <li className="timeline__item timeline__item--endpoint">
          <span className="timeline__marker">
            <BagIcon size={14} />
          </span>
          <div className="timeline__body">
            <div className="timeline__label">Head to checkout</div>
          </div>
        </li>
      </ol>
    </section>
  );
}
