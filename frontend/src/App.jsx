import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAisles, planTrip } from "./api.js";
import AisleDirectory from "./components/AisleDirectory.jsx";
import AppHeader from "./components/AppHeader.jsx";
import { AlertIcon } from "./components/Icons.jsx";
import ItemList, { itemStatuses } from "./components/ItemList.jsx";
import Planner from "./components/Planner.jsx";
import RouteSteps from "./components/RouteSteps.jsx";
import StoreMap from "./components/StoreMap.jsx";

const DEFAULT_API = "http://localhost:8000";
const API_STORAGE_KEY = "shopper-assist:api-base";

export default function App() {
  const [apiBase, setApiBase] = useState(() => localStorage.getItem(API_STORAGE_KEY) || DEFAULT_API);
  const [connection, setConnection] = useState({ state: "checking", message: "" });
  const [aisles, setAisles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  const loadAisles = useCallback((base) => {
    let cancelled = false;
    setConnection({ state: "checking", message: "" });
    getAisles(base)
      .then((data) => {
        if (cancelled) return;
        setAisles(data);
        setConnection({ state: "ok", message: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setAisles([]);
        setConnection({ state: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadAisles(apiBase), [apiBase, loadAisles]);

  function handleApiBaseChange(next) {
    localStorage.setItem(API_STORAGE_KEY, next);
    if (next === apiBase) loadAisles(next);
    else setApiBase(next);
  }

  async function handleSubmit({ text, file }) {
    setLoading(true);
    setError("");
    try {
      const data = await planTrip({ apiBase, text, file });
      setResult(data);
      // On stacked (mobile) layouts the results are below the fold.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categoryByAisle = useMemo(() => Object.fromEntries(aisles.map((a) => [a.aisle_id, a.category])), [aisles]);
  const items = useMemo(() => (result ? itemStatuses(result) : []), [result]);
  const routeAisles = useMemo(
    () => new Set(result ? result.route.stops.filter((s) => s.type === "shelf").map((s) => s.aisle_id) : []),
    [result]
  );

  const found = items.filter((i) => i.status === "found").length;
  const issues = items.length - found;

  return (
    <div className="app">
      <AppHeader apiBase={apiBase} onApiBaseChange={handleApiBaseChange} connection={connection} />

      <main className="layout">
        <div className="layout__rail">
          <Planner onSubmit={handleSubmit} loading={loading} error={error} />
          <AisleDirectory aisles={aisles} connection={connection} routeAisles={routeAisles} />
        </div>

        <div className="layout__main" ref={resultsRef}>
          <section className="card card--map" aria-labelledby="map-title">
            <div className="map-head">
              <div>
                <h2 id="map-title" className="card__title">
                  {result ? "Your route" : "Store map"}
                </h2>
                {!result && (
                  <p className="card__sub">Plan a trip and your route through the store will be drawn here.</p>
                )}
              </div>

              {result && (
                <dl className="stats">
                  <div className="stat">
                    <dt>Stops</dt>
                    <dd>{result.route.order.length}</dd>
                  </div>
                  <div className="stat">
                    <dt>Distance</dt>
                    <dd>
                      {result.route.total_distance}
                      <span className="stat__unit">units</span>
                    </dd>
                  </div>
                  <div className="stat">
                    <dt>Items found</dt>
                    <dd>
                      {found}
                      <span className="stat__unit">of {items.length}</span>
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <StoreMap aisles={aisles} route={result?.route} loading={loading} />

            <ul className="legend" aria-label="Map legend">
              <li>
                <span className="legend__swatch legend__swatch--endpoint" /> Entrance / checkout
              </li>
              <li>
                <span className="legend__swatch legend__swatch--stop" /> Stop
              </li>
              <li>
                <span className="legend__swatch legend__swatch--path" /> Walking path
              </li>
              <li>
                <span className="legend__swatch legend__swatch--visited" /> Aisle on route
              </li>
            </ul>
          </section>

          {result && issues > 0 && (
            <p className="alert alert--warn">
              <AlertIcon size={16} />
              <span>
                {issues} item{issues === 1 ? "" : "s"} on your list {issues === 1 ? "isn't" : "aren't"} on the route.
                Check "Your list" below for details.
              </span>
            </p>
          )}

          {result && (
            <div className="results-grid">
              <RouteSteps route={result.route} categoryByAisle={categoryByAisle} />
              <ItemList items={items} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
