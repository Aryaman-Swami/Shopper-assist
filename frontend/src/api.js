export async function getAisles(apiBase) {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/aisles`);
  if (!res.ok) throw new Error("Could not load aisle directory.");
  const data = await res.json();
  return data.aisles;
}

export async function planTrip({ apiBase, text, file }) {
  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  } else {
    formData.append("text", text);
  }

  const res = await fetch(`${apiBase.replace(/\/$/, "")}/plan`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong.");
  }
  return data;
}
