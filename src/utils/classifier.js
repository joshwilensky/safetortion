// ultra-simple heuristic MVP; replace with on-device ML later.
const riskyPhrases = [
  "send nudes",
  "i'll leak",
  "i will leak",
  "expose you",
  "pay me",
  "bitcoin",
  "gift card",
  "western union",
  "money now",
  "or else",
  "sextortion",
  "threat",
  "blackmail",
  "share your pictures",
  "post your pics",
  "send more",
  "do it now",
];

export function scanTextForRisk(text) {
  const t = (text || "").toLowerCase();
  let hits = [];
  for (const phrase of riskyPhrases) {
    if (t.includes(phrase)) hits.push(phrase);
  }
  // crude scoring
  const score = Math.min(100, Math.round((hits.length / 5) * 100));
  return { score, hits: Array.from(new Set(hits)) };
}
