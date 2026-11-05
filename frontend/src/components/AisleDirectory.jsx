import { useMemo, useState } from "react";
import { ChevronIcon, SearchIcon } from "./Icons.jsx";

export default function AisleDirectory({ aisles, connection, routeAisles }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return aisles.map((a) => ({ ...a, hits: a.items }));
    return aisles
      .map((a) => {
        const categoryHit = a.category.toLowerCase().includes(q);
        const hits = categoryHit ? a.items : a.items.filter((item) => item.toLowerCase().includes(q));
        return { ...a, hits };
      })
      .filter((a) => a.hits.length > 0);
  }, [aisles, q]);

  return (
    <section className="card directory" aria-labelledby="directory-title">
      <div className="card__head">
        <h2 id="directory-title" className="card__title">
          Store directory
        </h2>
        <p className="card__sub">Find which aisle carries what.</p>
      </div>

      {connection.state === "checking" && (
        <div className="directory__list" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton skeleton--row" />
          ))}
        </div>
      )}

      {connection.state === "error" && (
        <p className="empty-note">The directory is unavailable while the server is offline.</p>
      )}

      {connection.state === "ok" && aisles.length > 0 && (
        <>
          <div className="search">
            <SearchIcon size={16} />
            <label className="visually-hidden" htmlFor="directory-search">
              Search products or aisles
            </label>
            <input
              id="directory-search"
              className="input search__input"
              type="search"
              placeholder="Search products or aisles"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="empty-note">No products match "{query.trim()}".</p>
          ) : (
            <ul className="directory__list">
              {filtered.map((aisle) => (
                <li key={aisle.aisle_id}>
                  <details className="aisle" open={q ? true : undefined}>
                    <summary className="aisle__summary">
                      <span className={`aisle__num${routeAisles.has(aisle.aisle_id) ? " aisle__num--route" : ""}`}>
                        {aisle.aisle_id}
                      </span>
                      <span className="aisle__name">{aisle.category}</span>
                      {routeAisles.has(aisle.aisle_id) && <span className="tag tag--route">On route</span>}
                      <span className="aisle__count">{q ? `${aisle.hits.length} of ${aisle.items.length}` : aisle.items.length}</span>
                      <ChevronIcon size={16} className="aisle__chevron" />
                    </summary>
                    <ul className="aisle__items">
                      {aisle.hits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {connection.state === "ok" && aisles.length === 0 && (
        <p className="empty-note">The store directory is empty. Seed the database to populate it.</p>
      )}
    </section>
  );
}
