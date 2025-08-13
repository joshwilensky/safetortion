const BASE = import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:8080";

export async function createEvidenceLink({ label, target }) {
  const r = await fetch(`${BASE}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, target }),
  });
  if (!r.ok) throw new Error("Failed to create link");
  return r.json(); // { id, url }
}

export async function fetchEvidenceLink(id) {
  const r = await fetch(`${BASE}/api/links/${id}`);
  if (!r.ok) throw new Error("Not found");
  return r.json();
}
