import "dotenv/config";
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

/** ENV options:
 *  GEO_PROVIDER=ipapi|ipinfo (default ipapi)
 *  IPINFO_TOKEN=xxxxx          (if GEO_PROVIDER=ipinfo)
 *  GEO_MAXMIND_DB_PATH=/abs/path/to/GeoLite2-City.mmdb  (use offline lookup if set)
 */
const GEO_PROVIDER = process.env.GEO_PROVIDER || "ipapi";
const GEO_MAXMIND_DB_PATH = process.env.GEO_MAXMIND_DB_PATH || "";
let maxmindReader = null;

if (GEO_MAXMIND_DB_PATH && fs.existsSync(GEO_MAXMIND_DB_PATH)) {
  //   const { open } = await import("maxmind");
  //   maxmindReader = await open(GEO_MAXMIND_DB_PATH);
  //   console.log("[geo] Using MaxMind DB at", GEO_MAXMIND_DB_PATH);
  // } else {
  //   console.log("[geo] Using HTTP provider:", GEO_PROVIDER);
  // }
  try {
    const { open } = await import("maxmind");
    maxmindReader = await open(GEO_MAXMIND_DB_PATH);
    console.log("[geo] Using MaxMind DB at", GEO_MAXMIND_DB_PATH);
  } catch (err) {
    console.warn(
      "[geo] MaxMind DB present but 'maxmind' module not installed. Falling back to HTTP provider.",
      err?.message
    );
  }
} else {
  console.log("[geo] Using HTTP provider:", GEO_PROVIDER);
}

/** In-memory demo store. Replace with real DB in production. */
const links = new Map(); // id -> { createdAt, label, target, events: [] }

/** Create a new evidence link */
app.post("/api/links", (req, res) => {
  const { label = "evidence link", target = "https://example.com" } =
    req.body || {};
  const id = nanoid(10);
  links.set(id, { createdAt: Date.now(), label, target, events: [] });
  res.json({ id, url: `/r/${id}` });
});

/** Fetch a link and its events */
app.get("/api/links/:id", (req, res) => {
  const row = links.get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({ id: req.params.id, ...row });
});

/** Redirect + log IP/UA + geolocation */
app.get("/r/:id", async (req, res) => {
  const row = links.get(req.params.id);
  if (!row) return res.status(404).send("Not found");

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const ua = req.headers["user-agent"] || "unknown";

  let geo = await geoLookup(ip).catch(() => null);
  // Normalize the stored event
  const evt = {
    at: Date.now(),
    ip,
    ua,
    geo: geo && {
      city: geo.city || null,
      region: geo.region || null,
      country: geo.country || null,
      countryCode: geo.countryCode || null,
      lat: geo.lat ?? null,
      lon: geo.lon ?? null,
      provider: geo.provider || null,
    },
  };

  row.events.push(evt);
  res.redirect(row.target);
});
app.get("/", (_req, res) => {
  res.type("text").send(
    `SafeLink API is live.

Useful endpoints:
  • GET  /healthz
  • POST /api/links        { label, target }
  • GET  /api/links/:id
  • GET  /r/:id            (redirects + logs IP/UA/geo)

Frontend is deployed separately on Vercel.`
  );
});
app.get("/healthz", (_req, res) => res.json({ ok: true }));
/** Geo lookup with fallback chain */
async function geoLookup(ip) {
  // Skip private/local IPs
  if (
    ip === "unknown" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::1")
  ) {
    return {
      provider: "local",
      city: null,
      region: null,
      country: null,
      countryCode: null,
      lat: null,
      lon: null,
    };
  }

  // Prefer offline MaxMind if present
  if (maxmindReader) {
    try {
      const res = maxmindReader.get(ip);
      return {
        provider: "maxmind",
        city: res?.city?.names?.en || null,
        region: res?.subdivisions?.[0]?.names?.en || null,
        country: res?.country?.names?.en || null,
        countryCode: res?.country?.iso_code || null,
        lat: res?.location?.latitude ?? null,
        lon: res?.location?.longitude ?? null,
      };
    } catch {}
  }

  // HTTP providers
  if (GEO_PROVIDER === "ipinfo") {
    const token = process.env.IPINFO_TOKEN || "";
    const url = `https://ipinfo.io/${ip}?token=${token}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      const [lat, lon] = (j.loc || "").split(",").map(Number);
      return {
        provider: "ipinfo",
        city: j.city || null,
        region: j.region || null,
        country: j.country || null,
        countryCode: j.country || null,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
      };
    }
  }

  // Default: ipapi.co (no token, rate-limited)
  {
    const r = await fetch(`https://ipapi.co/${ip}/json/`);
    if (r.ok) {
      const j = await r.json();
      return {
        provider: "ipapi",
        city: j.city || null,
        region: j.region || j.region_code || null,
        country: j.country_name || null,
        countryCode: j.country || null,
        lat: j.latitude ?? null,
        lon: j.longitude ?? null,
      };
    }
  }

  return null;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("SafeLink server listening on " + PORT));
