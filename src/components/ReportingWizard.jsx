// src/components/ReportingWizard.jsx
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import PlatformSelect from "./PlatformSelect.jsx";
import PlatformIcon from "./PlatformIcon.jsx";
import {
  PLATFORMS,
  platformById,
  detectPlatformFromUrl,
} from "../data/platforms.js";
import { COUNTRIES } from "../data/countries.js";
import { getReportTargets } from "../data/reporting.js";
import CountrySelect from "./CountrySelect.jsx";

export default function ReportingWizard() {
  const { evidence } = useApp();

  const [form, setForm] = useState({
    platformId: "instagram",
    suspect: "", // handle or full profile URL
    country: "",
    contactEmail: "",
    description: "",
  });

  const [generated, setGenerated] = useState("");
  const [preview, setPreview] = useState(null);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Build the live preview from handle/URL + platform
  useEffect(() => {
    const s = (form.suspect || "").trim();
    const selected = platformById(form.platformId);

    if (!s) {
      setPreview(null);
      return;
    }

    // If it's a URL, try to detect and parse
    if (/^https?:\/\//i.test(s)) {
      const detected = detectPlatformFromUrl(s) || selected;
      const handle = detected?.fromUrl?.(s) || null;
      setPreview({ platform: detected, url: s, handle });
    } else {
      // It's a handle/username — compose canonical URL with selected platform
      const handle = s.replace(/^@/, "");
      const url = selected.toUrl(handle);
      setPreview({ platform: selected, url, handle });
    }
  }, [form.suspect, form.platformId]);

  // Quick suggestions (native datalist) when typing a handle
  const suggestions = useMemo(() => {
    const s = form.suspect.trim();
    if (!s || /^https?:\/\//i.test(s)) return [];
    const h = s.replace(/^@/, "");
    return PLATFORMS.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      url: p.toUrl(h),
    }));
  }, [form.suspect]);

  const generateSummary = () => {
    const plat = platformById(form.platformId);
    const lines = [];
    lines.push(`# Incident Summary`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push(`Platform: ${plat.name}`);
    lines.push(`Suspect: ${form.suspect || "(unspecified)"}`);
    lines.push(`Country: ${form.country || "(unspecified)"}`);
    lines.push(`Contact: ${form.contactEmail || "(unspecified)"}`);
    lines.push("");
    lines.push(`## Description`);
    lines.push((form.description || "(no description)").trim());
    lines.push("");
    lines.push(`## Evidence Items (${evidence.length})`);
    evidence.forEach((e, i) => {
      lines.push(
        `- [${i + 1}] ${e.type} • ${e.title || "(Untitled)"} • ${new Date(
          e.createdAt
        ).toISOString()}`
      );
    });
    setGenerated(lines.join("\n"));
  };

  const downloadTxt = () => {
    const blob = new Blob([generated || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident_summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build + copy platform report template
  const buildReportText = () => {
    const p = platformById(form.platformId);
    const url = preview?.url || "";
    const lines = [];
    lines.push(`[${p.name}] Report: Possible sextortion / blackmail`);
    if (url) lines.push(`Profile: ${url}`);
    if (preview?.handle) lines.push(`Handle: @${preview.handle}`);
    lines.push(`Your country: ${form.country || "(unspecified)"}`);
    if (form.contactEmail) lines.push(`Contact email: ${form.contactEmail}`);
    lines.push("");
    lines.push("Description:");
    lines.push((form.description || "(no description)").trim());
    lines.push("");
    lines.push(
      `Evidence items in my local vault: ${evidence.length} (screenshots/text available on request).`
    );
    return lines.join("\n");
  };
  const copyReportText = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      alert("Template copied.");
    } catch {
      alert("Copy failed—select and copy manually.");
    }
  };

  return (
    <section className='grid responsive'>
      {/* Left: form */}
      <div className='card'>
        <h2>Report & Takedown Helper</h2>

        <div className='grid two'>
          {/* Platform (custom select with icons) */}
          <PlatformSelect
            value={form.platformId}
            onChange={(id) => setField("platformId", id)}
            label='Platform'
          />

          {/* Country dropdown */}
          <CountrySelect
            value={form.country}
            onChange={(c) => setField("country", c)}
            label='Your Country'
          />

          {/* Contact email */}
          <Field
            label='Contact email (for updates)'
            value={form.contactEmail}
            onChange={(v) => setField("contactEmail", v)}
          />
        </div>

        {/* Suspect handle/url with autocomplete */}
        <label style={{ display: "block", marginTop: 10 }}>
          <div style={{ marginBottom: 6 }}>Suspect handle or profile URL</div>
          <input
            className='input'
            value={form.suspect}
            onChange={(e) => setField("suspect", e.target.value)}
            placeholder='@username or https://platform.com/user'
            list='suspect-suggestions'
          />
          {/* datalist for native autocomplete */}
          <datalist id='suspect-suggestions'>
            {suggestions.map((s) => (
              <option key={s.id} value={s.url}>{`${s.name}: ${s.url}`}</option>
            ))}
          </datalist>
        </label>

        {/* Live account preview */}
        {preview && (
          <div
            className='card'
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
            <PlatformIcon
              id={preview.platform.id}
              color={preview.platform.color}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{preview.platform.name}</div>
              <div
                style={{
                  opacity: 0.85,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                <a
                  className='link'
                  href={preview.url}
                  target='_blank'
                  rel='noreferrer'>
                  {preview.url}
                </a>
              </div>
              {preview.handle && (
                <div className='badge' style={{ marginTop: 6 }}>
                  Handle: {preview.handle}
                </div>
              )}
            </div>
            <a
              className='btn'
              href={preview.url}
              target='_blank'
              rel='noreferrer'>
              Open
            </a>
          </div>
        )}

        {/* Report actions (links + copyable template) */}
        {preview && (
          <div className='card' style={{ marginTop: 10 }}>
            <div
              className='row'
              style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className='row' style={{ alignItems: "center", gap: 8 }}>
                <PlatformIcon
                  id={preview.platform.id}
                  color={preview.platform.color}
                />
                <b>Report this account</b>
              </div>
              <button className='btn' onClick={copyReportText}>
                Copy report template
              </button>
            </div>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {getReportTargets(preview.platform.id).map((t, i) => (
                <li key={i} style={{ marginTop: 6 }}>
                  {t.url ? (
                    <a
                      className='link'
                      href={t.url}
                      target='_blank'
                      rel='noreferrer'>
                      {t.label}
                    </a>
                  ) : (
                    <span className='badge'>{t.label}</span>
                  )}
                  {t.note && (
                    <div className='muted' style={{ marginTop: 4 }}>
                      {t.note}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        <FieldTextarea
          label='Description (facts only)'
          value={form.description}
          onChange={(v) => setField("description", v)}
          rows={6}
        />

        <div className='row' style={{ justifyContent: "flex-end" }}>
          <button className='btn primary' onClick={generateSummary}>
            Generate Summary
          </button>
        </div>
      </div>

      {/* Right: generated output */}
      <div className='card'>
        <h3>Generated Summary</h3>
        {!generated ? (
          <p>Fill the form and click Generate.</p>
        ) : (
          <>
            <pre style={{ whiteSpace: "pre-wrap" }}>{generated}</pre>
            <div className='row' style={{ justifyContent: "flex-end" }}>
              <button className='btn' onClick={downloadTxt}>
                Download .txt
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* Reusable fields */
function Field({ label, value, onChange }) {
  return (
    <label>
      <div style={{ marginBottom: 6 }}>{label}</div>
      <input
        className='input'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function FieldTextarea({ label, value, onChange, rows = 4 }) {
  return (
    <label>
      <div style={{ marginBottom: 6 }}>{label}</div>
      <textarea
        className='input'
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
