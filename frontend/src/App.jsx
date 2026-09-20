import { useEffect, useState } from "react";
import { getAisles, planTrip } from "./api.js";
import AisleDirectory from "./components/AisleDirectory.jsx";
import RouteSteps from "./components/RouteSteps.jsx";
import StoreMap from "./components/StoreMap.jsx";

export default function App() {
  const [apiBase, setApiBase] = useState("http://localhost:8000");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ message: "", isError: false });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aisles, setAisles] = useState([]);

  useEffect(() => {
    getAisles(apiBase).then(setAisles).catch(() => setAisles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryByAisle = Object.fromEntries(aisles.map((a) => [a.aisle_id, a.category]));

  async function handleSubmit() {
    if (!text.trim() && !file) {
      setStatus({ message: "Enter a list or choose a photo first.", isError: true });
      return;
    }

    setLoading(true);
    setStatus({ message: "Planning your route...", isError: false });
    setResult(null);

    try {
      const data = await planTrip({ apiBase, text: text.trim(), file });
      setResult(data);
      setStatus({ message: "", isError: false });
    } catch (err) {
      setStatus({ message: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header>
        <h1>Shopper Assist</h1>
        <p className="subtitle">Paste your shopping list, get the fastest route through the store.</p>
      </header>

      <main>
        <section className="input-panel">
          <label htmlFor="api-base">API base URL</label>
          <input
            id="api-base"
            type="text"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
          />

          <label htmlFor="list-text">Shopping list</label>
          <textarea
            id="list-text"
            rows={5}
            placeholder="e.g. 2 bananas, a dozen eggs, cocacola, band aids"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="or-divider">or</div>

          <label htmlFor="list-image">Upload a photo of your list</label>
          <input
            id="list-image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0] ?? null)}
          />

          <button onClick={handleSubmit} disabled={loading}>
            Plan my route
          </button>
          <p className={`status${status.isError ? " error" : ""}`}>{status.message}</p>
        </section>

        <AisleDirectory aisles={aisles} />

        {result && (
          <section className="results-panel">
            <div className="items-column">
              <h2>Extracted items</h2>
              <ul>
                {result.extracted_items.map((item, i) => (
                  <li key={i}>
                    {item.qty ?? 1}
                    {item.unit ? ` ${item.unit}` : ""} {item.name}
                  </li>
                ))}
              </ul>

              {result.unmatched?.length > 0 && (
                <div>
                  <h3>Couldn't confidently match</h3>
                  <ul className="unmatched-list">
                    {result.unmatched.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.out_of_stock?.length > 0 && (
                <div>
                  <h3>Out of stock</h3>
                  <ul className="oos-list">
                    {result.out_of_stock.map((o, i) => (
                      <li key={i}>
                        {o.name || o.sku}
                        {o.query ? ` (matched from "${o.query}")` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="distance-line">
                Total walking distance: {result.route.total_distance} units across{" "}
                {result.route.order.length} stop(s).
              </p>

              <RouteSteps route={result.route} aisleByCategory={categoryByAisle} />
            </div>

            <div className="map-column">
              <h2>Route map</h2>
              <StoreMap aisles={aisles} route={result.route} />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
