import { useEffect, useRef, useState } from "react";
import { LogoMark, SettingsIcon } from "./Icons.jsx";

const STATUS_LABEL = {
  checking: "Connecting",
  ok: "Connected",
  error: "Offline",
};

export default function AppHeader({ apiBase, onApiBaseChange, connection }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(apiBase);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDraft(apiBase);
    inputRef.current?.focus();

    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, apiBase]);

  function handleSave(e) {
    e.preventDefault();
    onApiBaseChange(draft.trim() || apiBase);
    setOpen(false);
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="/" aria-label="Shopper Assist home">
          <LogoMark />
          <span className="brand__name">Shopper Assist</span>
        </a>

        <div className="settings" ref={wrapRef}>
          <button
            type="button"
            className="btn btn--ghost settings__toggle"
            aria-expanded={open}
            aria-controls="settings-panel"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`status-dot status-dot--${connection.state}`} aria-hidden="true" />
            <span className="settings__status">{STATUS_LABEL[connection.state]}</span>
            <SettingsIcon />
            <span className="visually-hidden">Server settings</span>
          </button>

          {open && (
            <form id="settings-panel" className="settings__panel" onSubmit={handleSave}>
              <label className="field-label" htmlFor="api-base">
                API address
              </label>
              <input
                id="api-base"
                ref={inputRef}
                className="input"
                type="url"
                inputMode="url"
                spellCheck="false"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <p className={`field-hint${connection.state === "error" ? " field-hint--error" : ""}`}>
                {connection.state === "error"
                  ? connection.message
                  : "The Shopper Assist backend that plans routes and serves the store directory."}
              </p>
              <div className="settings__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save and reconnect
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
