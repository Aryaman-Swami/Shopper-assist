function base(apiBase) {
  return apiBase.trim().replace(/\/$/, "");
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getAisles(apiBase) {
  let res;
  try {
    res = await fetch(`${base(apiBase)}/aisles`);
  } catch {
    throw new Error("Can't reach the server. Check the API address in Settings.");
  }
  if (!res.ok) throw new Error("Could not load the store directory.");
  const data = await readJson(res);
  return data.aisles ?? [];
}

export async function planTrip({ apiBase, text, file }) {
  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  } else {
    formData.append("text", text);
  }

  let res;
  try {
    res = await fetch(`${base(apiBase)}/plan`, { method: "POST", body: formData });
  } catch {
    throw new Error("Can't reach the server. Check the API address in Settings.");
  }
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong while planning your route.");
  }
  return data;
}
