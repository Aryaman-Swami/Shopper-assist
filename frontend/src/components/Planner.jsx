import { useEffect, useId, useRef, useState } from "react";
import { AlertIcon, CameraIcon, CloseIcon, ListIcon, UploadIcon } from "./Icons.jsx";

const EXAMPLE = "2 bananas, a dozen eggs, coca cola, band aids, whole wheat bread";

export default function Planner({ onSubmit, loading, error }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);
  const ids = { text: useId(), photo: useId(), file: useId() };

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setLocalError("That file isn't an image. Try a JPG, PNG or HEIC photo of your list.");
      return;
    }
    setLocalError("");
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (mode === "text" && !text.trim()) {
      setLocalError("Add at least one item to your list.");
      return;
    }
    if (mode === "photo" && !file) {
      setLocalError("Choose a photo of your list first.");
      return;
    }
    setLocalError("");
    onSubmit(mode === "text" ? { text: text.trim() } : { file });
  }

  const message = localError || error;

  return (
    <section className="card planner" aria-labelledby="planner-title">
      <div className="card__head">
        <h1 id="planner-title" className="planner__title">
          Plan a shopping trip
        </h1>
        <p className="card__sub">
          Give us your list and we'll order the aisles so you walk the shortest path from entrance to checkout.
        </p>
      </div>

      <div className="segmented" role="tablist" aria-label="How do you want to add your list?">
        <button
          type="button"
          role="tab"
          id={`${ids.text}-tab`}
          aria-selected={mode === "text"}
          aria-controls={ids.text}
          className="segmented__btn"
          onClick={() => {
            setMode("text");
            setLocalError("");
          }}
        >
          <ListIcon size={16} /> Type a list
        </button>
        <button
          type="button"
          role="tab"
          id={`${ids.photo}-tab`}
          aria-selected={mode === "photo"}
          aria-controls={ids.photo}
          className="segmented__btn"
          onClick={() => {
            setMode("photo");
            setLocalError("");
          }}
        >
          <CameraIcon size={16} /> Upload a photo
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {mode === "text" ? (
          <div role="tabpanel" id={ids.text} aria-labelledby={`${ids.text}-tab`}>
            <label className="visually-hidden" htmlFor={`${ids.text}-input`}>
              Shopping list
            </label>
            <textarea
              id={`${ids.text}-input`}
              className="input textarea"
              rows={6}
              placeholder={`e.g. ${EXAMPLE}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
              }}
            />
            <div className="field-row">
              <p className="field-hint">Separate items with commas or new lines.</p>
              {!text && (
                <button type="button" className="link-btn" onClick={() => setText(EXAMPLE)}>
                  Try an example
                </button>
              )}
            </div>
          </div>
        ) : (
          <div role="tabpanel" id={ids.photo} aria-labelledby={`${ids.photo}-tab`}>
            <input
              ref={fileInputRef}
              id={ids.file}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {file ? (
              <div className="photo-preview">
                {preview && <img src={preview} alt="Your shopping list" />}
                <div className="photo-preview__meta">
                  <span className="photo-preview__name">{file.name}</span>
                  <span className="field-hint">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <button type="button" className="icon-btn" onClick={clearFile} aria-label="Remove photo">
                  <CloseIcon size={16} />
                </button>
              </div>
            ) : (
              <label
                htmlFor={ids.file}
                className={`dropzone${dragging ? " dropzone--active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
              >
                <UploadIcon size={22} />
                <span className="dropzone__title">
                  <span className="dropzone__cta">Choose a photo</span> or drag it here
                </span>
                <span className="field-hint">Handwritten or printed lists both work.</span>
              </label>
            )}
          </div>
        )}

        {message && (
          <p className="alert alert--error" role="alert">
            <AlertIcon size={16} />
            <span>{message}</span>
          </p>
        )}

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" /> Planning your route
            </>
          ) : (
            "Plan my route"
          )}
        </button>
      </form>
    </section>
  );
}
