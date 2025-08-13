import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useToast } from "./ui/ToastProvider.jsx";
import BackupModal from "./BackupModal.jsx";
import { purgeArchive, archiveItems, listArchives } from "../utils/archive.js";

export default function GlobalSafety() {
  const { evidence, clearEvidence } = useApp();
  const toast = useToast();

  const [stealth, setStealth] = useState(() => sessionStorage.getItem("stealth_on") === "1");
  const [bkOpen, setBkOpen] = useState(false);

  // Quick Exit (hold P for 3s)
  const holdRef = useRef({ down: false, t0: 0, raf: 0 });
  const [holdPct, setHoldPct] = useState(0);
  const HOLD_MS = 3000;

  // Apply/remove stealth side effects
  useEffect(() => {
    const origTitle = document.title;
    const origIcon = getFaviconHref();
    if (stealth) {
      document.body.classList.add("stealth");
      document.title = "Calculator";
      setFaviconDataURI(
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%230d132b'/><text x='50%25' y='60%25' font-size='38' text-anchor='middle' fill='%23b7c0ff'>÷</text></svg>"
      );
      sessionStorage.setItem("stealth_on", "1");
      toast.show({ message: "Stealth mode on. Press H to toggle.", variant: "info", duration: 3000 });
    } else {
      document.body.classList.remove("stealth");
      document.title = origTitle;
      setFaviconHref(origIcon);
      sessionStorage.removeItem("stealth_on");
    }
    return () => {
      // on unmount: restore
      document.body.classList.remove("stealth");
      document.title = origTitle;
      setFaviconHref(origIcon);
    };
  }, [stealth]); // eslint-disable-line

  // Hotkeys: H toggles stealth, hold P = quick exit
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = (e.key || "").toLowerCase();
      if (k === "h" && !e.repeat) setStealth((v) => !v);
      if (k === "p" && !e.repeat && !holdRef.current.down) {
        holdRef.current.down = true;
        holdRef.current.t0 = performance.now();
        loop();
      }
    };
    const onKeyUp = (e) => {
      if ((e.key || "").toLowerCase() === "p") {
        holdRef.current.down = false;
        cancelAnimationFrame(holdRef.current.raf);
        setHoldPct(0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const loop = () => {
    const step = () => {
      if (!holdRef.current.down) return;
      const dt = performance.now() - holdRef.current.t0;
      const pct = Math.min(1, dt / HOLD_MS);
      setHoldPct(pct);
      if (pct >= 1) {
        quickExit();
        holdRef.current.down = false;
        setHoldPct(0);
        return;
      }
      holdRef.current.raf = requestAnimationFrame(step);
    };
    step();
  };

  // Quick Exit routine
  const quickExit = async () => {
    try {
      // Clear UI data
      clearEvidence();
      purgeArchive(); // empties recently deleted
      // Clear local/session keys we own
      localStorage.removeItem("vault_ct");
      localStorage.removeItem("retention_days");
      localStorage.removeItem("retention_hard");
      // Optional: wipe any app-specific prefixes (safelink_)
      Object.keys(localStorage).forEach((k) => {
        if (/^safelink_/i.test(k)) localStorage.removeItem(k);
      });
    } catch {}
    // Hard redirect to a neutral page
    window.location.replace("https://www.google.com/");
  };

  const itemsInTrash = useMemo(() => listArchives().length, []);

  return (
    <>
      <div className="safety-bar">
        <button
          className={`btn ghost ${stealth ? "active" : ""}`}
          onClick={() => setStealth((v) => !v)}
          title="Stealth mode (H)"
        >
          {stealth ? "Stealth: ON" : "Stealth"}
        </button>

        <button className="btn ghost" onClick={() => setBkOpen(true)} title="Backup / Restore vault">
          Backup / Restore
        </button>

        <button
          className="btn danger"
          onClick={quickExit}
          title="Quick Exit (hold P)"
          aria-label="Quick exit"
        >
          Quick Exit
        </button>

        {/* Hold progress hint */}
        <div className={`hold-hint ${holdPct > 0 ? "show" : ""}`} aria-hidden={holdPct === 0}>
          Hold P to Quick Exit
          <div className="hold-bar"><div className="hold-fill" style={{ width: `${holdPct * 100}%` }} /></div>
        </div>
      </div>

      <BackupModal
        open={bkOpen}
        onClose={() => setBkOpen(false)}
        onExported={() => setBkOpen(false)}
        onImported={() => setBkOpen(false)}
        itemsInTrash={itemsInTrash}
      />
    </>
  );
}

/* favicon helpers */
function getFaviconHref() {
  const el = document.querySelector("link[rel='icon']") || document.createElement("link");
  return el?.href || "";
}
function setFaviconHref(href) {
  const el = document.querySelector("link[rel='icon']") || document.createElement("link");
  el.setAttribute("rel", "icon");
  el.setAttribute("href", href);
  if (!el.parentNode) document.head.appendChild(el);
}
function setFaviconDataURI(dataUri) { setFaviconHref(dataUri); }
