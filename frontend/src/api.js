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
