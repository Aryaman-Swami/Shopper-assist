export default function RouteSteps({ route, aisleByCategory }) {
  const steps = route.stops.map((stop, idx) => {
    if (stop.type === "entrance") return { key: "entrance", label: "Start at the entrance" };
    if (stop.type === "checkout") return { key: "checkout", label: "Head to checkout" };

    const items = route.items_by_stop[stop.node] || [];
    const category = aisleByCategory[stop.aisle_id] || "Unknown";
    return {
      key: stop.node,
      label: `Aisle ${stop.aisle_id} — ${category}`,
      items: items.map((i) => i.name),
      stepNum: route.order.indexOf(stop.node) + 1,
    };
  });

  return (
    <div className="route-steps">
      <h3>Walking directions</h3>
      <ol>
        {steps.map((step) => (
          <li key={step.key} className={step.items ? "stop" : "endpoint"}>
            {step.stepNum ? <span className="stop-num">{step.stepNum}</span> : null}
            <div>
              <div className="step-label">{step.label}</div>
              {step.items && <div className="step-items">{step.items.join(", ")}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
