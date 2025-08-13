// Simple client-side heuristics to flag risky messages.
// Returns: { score (0-100), level: 'red'|'yellow'|'green', signals: [{label, weight, snippet}] }

const RULESETS = [
  {
    label: "Threat / exposure",
    weight: 35,
    patterns: [
      /i'?ll (?:post|share|expose)/i,
      /i will (?:post|share|expose)/i,
      /(expose|leak).*(you|pics|photos|videos)/i,
      /(send|pay).*(or|else)/i,
      /if you don'?t (?:pay|send)/i,
      /ruin your (?:life|reputation)/i,
    ],
  },
  {
    label: "Demands for money",
    weight: 30,
    patterns: [
      /\bpay\b/i,
      /\bmoney\b/i,
      /\bransom\b/i,
      /gift ?card/i,
      /prepaid/i,
      /steam card/i,
      /apple ?card/i,
      /google ?play/i,
      /bitcoin|btc|crypto|usdt|binance|wallet|cashapp|venmo|western union/i,
    ],
  },
  {
    label: "Requests for explicit images",
    weight: 25,
    patterns: [
      /\bsend (?:me )?(?:nudes?|explicit|naked|nsfw)\b/i,
      /send (?:pics?|photos?).*(now|proof)/i,
      /\bvideo call\b.*\bclothes off\b/i,
    ],
  },
  {
    label: "Urgency / countdown",
    weight: 10,
    patterns: [
      /\b(24|12|48)\s?hours?\b/i,
      /\bdeadline\b/i,
      /\bnow\b/i,
      /\bimmediately\b/i,
      /\bright now\b/i,
    ],
  },
  {
    label: "Move off-platform",
    weight: 10,
    patterns: [
      /snap(chat)?[: ]/i,
      /\bwhats?app\b/i,
      /\btelegram\b/i,
      /\bt\.me\/\w+/i,
    ],
  },
  {
    label: "Impersonation (authority/platform)",
    weight: 15,
    patterns: [
      /\b(fbi|police|interpol|sheriff|cia)\b/i,
      /(meta|instagram|facebook|trust & safety|support) (team|security|agent)/i,
    ],
  },
  {
    label: "Underage / legal risk",
    weight: 20,
    patterns: [
      /\bunder\s?age\b/i,
      /\bminor\b/i,
      /\b17\b|\b16\b|\b15\b|\b14\b|\b13\b/i,
      /child (?:porn|abuse|exploitation)/i,
    ],
  },
];

export function computeRisk(message) {
  const text = String(message || "").slice(0, 10000); // safety cap
  const signals = [];
  let score = 0;

  RULESETS.forEach((rule) => {
    for (const re of rule.patterns) {
      const m = text.match(re);
      if (m) {
        score += rule.weight;
        signals.push({
          label: rule.label,
          weight: rule.weight,
          snippet: snippetAround(text, m.index ?? 0, 40),
        });
        break; // count each ruleset at most once
      }
    }
  });

  // Normalize 0..100
  score = Math.max(0, Math.min(100, score));

  let level = "green";
  if (score >= 60) level = "red";
  else if (score >= 30) level = "yellow";

  return { score, level, signals };
}

function snippetAround(text, idx, span) {
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, (idx || 0) + span);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}
