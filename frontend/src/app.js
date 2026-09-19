const NUM_AISLES = 8;
const FRONT_Y = 0;
const BACK_Y = 10;

const els = {
  apiBase: document.getElementById("api-base"),
  listText: document.getElementById("list-text"),
  listImage: document.getElementById("list-image"),
  submitBtn: document.getElementById("submit-btn"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),
  extractedList: document.getElementById("extracted-list"),
  unmatchedBlock: document.getElementById("unmatched-block"),
  unmatchedList: document.getElementById("unmatched-list"),
  oosBlock: document.getElementById("oos-block"),
  oosList: document.getElementById("oos-list"),
  distanceLine: document.getElementById("distance-line"),
  map: document.getElementById("store-map"),
};

els.submitBtn.addEventListener("click", handleSubmit);

async function handleSubmit() {
  const text = els.listText.value.trim();
  const file = els.listImage.files[0];

  if (!text && !file) {
    setStatus("Enter a list or choose a photo first.", true);
    return;
  }

  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  } else {
    formData.append("text", text);
  }

  els.submitBtn.disabled = true;
  setStatus("Planning your route...");
  els.results.hidden = true;

  try {
    const base = els.apiBase.value.replace(/\/$/, "");
    const res = await fetch(`${base}/plan`, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.detail || "Something went wrong.", true);
      return;
    }

    renderResults(data);
    setStatus("");
  } catch (err) {
    setStatus(`Request failed: ${err.message}`, true);
  } finally {
    els.submitBtn.disabled = false;
  }
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

function renderResults(data) {
  els.results.hidden = false;

  els.extractedList.innerHTML = "";
  data.extracted_items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.qty ?? 1}${item.unit ? " " + item.unit : ""} ${item.name}`;
    els.extractedList.appendChild(li);
  });

  const unmatched = data.unmatched || [];
  els.unmatchedBlock.hidden = unmatched.length === 0;
  els.unmatchedList.innerHTML = "";
  unmatched.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    els.unmatchedList.appendChild(li);
  });

  const oos = data.out_of_stock || [];
  els.oosBlock.hidden = oos.length === 0;
  els.oosList.innerHTML = "";
  oos.forEach((o) => {
    const li = document.createElement("li");
    li.textContent = o.name || o.sku;
    els.oosList.appendChild(li);
  });

  const route = data.route;
  els.distanceLine.textContent = `Total walking distance: ${route.total_distance} units across ${route.order.length} stop(s).`;

  drawMap(route);
}

function drawMap(route) {
  const svg = els.map;
  svg.innerHTML = "";

  const ns = "http://www.w3.org/2000/svg";
  const addLine = (x1, y1, x2, y2, cls) => {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", cls);
    svg.appendChild(line);
  };
  const addCircle = (x, y, r, cls) => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", r);
    c.setAttribute("class", cls);
    svg.appendChild(c);
  };
  const addText = (x, y, text, cls) => {
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("class", cls);
    t.textContent = text;
    svg.appendChild(t);
  };

  const style = document.createElementNS(ns, "style");
  style.textContent = `
    .aisle { stroke: #2a2e38; stroke-width: 0.15; }
    .corridor { stroke: #1c2028; stroke-width: 0.1; }
    .path { stroke: #5eead4; stroke-width: 0.18; fill: none; }
    .node-entrance { fill: #5eead4; }
    .node-checkout { fill: #f87171; }
    .node-stop { fill: #fbbf24; }
    .label { fill: #9aa0ab; font-size: 0.4px; }
  `;
  svg.appendChild(style);

  // aisles
  for (let i = 1; i <= NUM_AISLES; i++) {
    addLine(i, FRONT_Y, i, BACK_Y, "aisle");
    addText(i - 0.15, BACK_Y + 0.6, `A${i}`, "label");
  }
  // corridors
  addLine(1, FRONT_Y, NUM_AISLES, FRONT_Y, "corridor");
  addLine(1, BACK_Y, NUM_AISLES, BACK_Y, "corridor");

  // route path
  const pts = route.stops.map((s) => `${s.x},${s.y}`).join(" ");
  const polyline = document.createElementNS(ns, "polyline");
  polyline.setAttribute("points", pts);
  polyline.setAttribute("class", "path");
  svg.appendChild(polyline);

  route.stops.forEach((s) => {
    const cls = s.type === "entrance" ? "node-entrance" : s.type === "checkout" ? "node-checkout" : "node-stop";
    addCircle(s.x, s.y, 0.22, cls);
  });

  route.order.forEach((node, idx) => {
    const stop = route.stops.find((s) => s.node === node);
    if (stop) addText(stop.x + 0.3, stop.y + 0.15, String(idx + 1), "label");
  });
}
