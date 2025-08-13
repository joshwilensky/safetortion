// src/components/EvidenceVault.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useApp } from "../context/AppContext.jsx";
import Modal from "./ui/Modal.jsx";
import ConfirmClearAllModal from "./ConfirmClearAllModal.jsx";
import RiskIndicator from "./RiskIndicator.jsx";
import { useToast } from "./ui/ToastProvider.jsx";
import Thumb from "./Thumb.jsx";
import useHotkeys from "../utils/useHotkeys.js";
import EncryptionModal from "./EncryptionModal.jsx";
import ImageRedactor from "./ImageRedactor.jsx";
import RetentionModal from "./RetentionModal.jsx";
import { encryptJSON, decryptJSON } from "../utils/crypto.js";
import {
  archiveItems,
  listArchives,
  restoreArchive,
  purgeArchive,
  purgeExpired,
  msRemaining,
  formatCountdown,
} from "../utils/archive.js";

/* --- Harden: ignore malformed items to prevent crashes --- */
function isValidItem(e) {
  return e && typeof e === "object" && !Array.isArray(e) && "id" in e;
}

export default function EvidenceVault() {
  const { evidence, addEvidence, removeEvidence, clearEvidence } = useApp();
  const toast = useToast();

  // Filtered source of truth for rendering/ops
  const safeEvidence = useMemo(() => evidence.filter(isValidItem), [evidence]);

  // Layout/view state
  const [view, setView] = useState("grid"); // "grid" | "list"

  // UI state
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [sel, setSel] = useState(() => new Set());
  const [preview, setPreview] = useState(null);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState(() => listArchives());

  // Encryption
  const [encOpen, setEncOpen] = useState(false);
  const [encMode, setEncMode] = useState("lock"); // "lock" | "unlock"
  const locked = Boolean(localStorage.getItem("vault_ct"));

  // Image redactor
  const [redactItem, setRedactItem] = useState(null);
  const [redactOpen, setRedactOpen] = useState(false);

  // Retention
  const [retOpen, setRetOpen] = useState(false);
  const [retDays, setRetDays] = useState(() =>
    Number(localStorage.getItem("retention_days") || 0)
  );
  const [retHard, setRetHard] = useState(
    () => localStorage.getItem("retention_hard") === "1"
  );

  // Search box focus (Cmd/Ctrl-K)
  const searchRef = useRef(null);
  useHotkeys({ "mod+k": () => searchRef.current?.focus() });

  // housekeeping: purge expired recently-deleted; run retention on load
  useEffect(() => {
    const t1 = setInterval(() => {
      purgeExpired();
      setTrash(listArchives());
    }, 15_000);
    runRetention(); // once on mount
    return () => clearInterval(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // open redactor listener (from card button)
  useEffect(() => {
    const onOpenRedactor = (e) => {
      setRedactItem(e.detail);
      setRedactOpen(true);
    };
    window.addEventListener("open-redactor", onOpenRedactor);
    return () => window.removeEventListener("open-redactor", onOpenRedactor);
  }, []);

  // Log dropped items (dev aid)
  useEffect(() => {
    const bad = evidence.filter((e) => !isValidItem(e));
    if (bad.length)
      console.warn("[EvidenceVault] Dropped malformed items:", bad);
  }, [evidence]);

  const typesInVault = useMemo(() => {
    const set = new Set(safeEvidence.map((e) => e.type || "note"));
    return ["all", ...Array.from(set)];
  }, [safeEvidence]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = safeEvidence.slice();

    if (type !== "all") list = list.filter((e) => (e.type || "note") === type);
    if (query) {
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(query) ||
          (e.content || "").toLowerCase().includes(query)
      );
    }

    switch (sort) {
      case "oldest":
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case "type":
        list.sort(
          (a, b) =>
            (a.type || "").localeCompare(b.type || "") ||
            (b.createdAt || 0) - (a.createdAt || 0)
        );
        break;
      default:
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list;
  }, [safeEvidence, q, type, sort]);

  const toggleSel = (id) => {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSel(new Set(filtered.map((e) => e.id)));
  const clearSel = () => setSel(new Set());

  const softDeleteOne = (item) => {
    archiveItems([item]);
    removeEvidence(item.id);
    setTrash(listArchives());

    toast.show({
      message: `Moved “${
        item.title || "Untitled"
      }” to Recently Deleted.\nUndo available for 10 minutes.`,
      actionLabel: "UNDO",
      onAction: () => {
        const restored = restoreArchive(item.id);
        if (restored) addEvidence(restored);
        setTrash(listArchives());
      },
      duration: 7000,
      variant: "warning",
    });
  };

  const bulkSoftDelete = () => {
    if (sel.size === 0) return;
    const items = filtered.filter((e) => sel.has(e.id));
    archiveItems(items);
    items.forEach((i) => removeEvidence(i.id));
    clearSel();
    setTrash(listArchives());

    toast.show({
      message: `Moved ${items.length} item(s) to Recently Deleted.\nUndo available for 10 minutes.`,
      actionLabel: "UNDO ALL",
      onAction: () => {
        let restored = 0;
        items.forEach((it) => {
          const r = restoreArchive(it.id);
          if (r) {
            addEvidence(r);
            restored++;
          }
        });
        setTrash(listArchives());
        toast.show({
          message: `Restored ${restored} item(s).`,
          duration: 3500,
          variant: "success",
        });
      },
      duration: 7000,
      variant: "warning",
    });
  };

  const downloadCsv = () => {
    const rows = [
      [
        "id",
        "type",
        "title",
        "createdAt",
        "riskLevel",
        "riskScore",
        "content",
        "metadata",
      ],
    ];
    filtered.forEach((e) => {
      const risk = e.metadata?.risk || {};
      rows.push([
        e.id,
        e.type || "",
        (e.title || "").replace(/\n/g, " "),
        new Date(e.createdAt || 0).toISOString(),
        risk.level || "",
        typeof risk.score === "number" ? String(risk.score) : "",
        (e.content || "").slice(0, 400).replace(/\s+/g, " ").trim(),
        JSON.stringify(e.metadata || {}),
      ]);
    });
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  async function exportBundle() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    // index.csv
    const rows = [
      [
        "id",
        "type",
        "title",
        "createdAt",
        "riskLevel",
        "riskScore",
        "contentPreview",
      ],
    ];
    filtered.forEach((e) => {
      const risk = e.metadata?.risk || {};
      rows.push([
        e.id,
        e.type || "",
        (e.title || "").replace(/\n/g, " "),
        new Date(e.createdAt || 0).toISOString(),
        risk.level || "",
        typeof risk.score === "number" ? String(risk.score) : "",
        (e.content || "").slice(0, 250).replace(/\s+/g, " ").trim(),
      ]);
    });
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    zip.file("index.csv", csv);

    // summary.txt
    const summary = `Evidence bundle • ${new Date().toLocaleString()}\nItems: ${
      filtered.length
    }\n`;
    zip.file("summary.txt", summary);

    // assets/
    const folder = zip.folder("assets");
    for (const e of filtered) {
      if (e.type === "image") {
        const u = e.metadata?.blobUrl || e.metadata?.dataUrl;
        if (!u) continue;
        const blob = await fetch(u)
          .then((r) => r.blob())
          .catch(() => null);
        if (!blob) continue;
        const name = (
          e.title || `img_${e.id || Math.random().toString(36).slice(2)}`
        ).replace(/[^\w.-]+/g, "_");
        folder.file(`${name}.jpg`, blob);
      } else if (e.content) {
        folder.file(
          `${(e.title || `note_${e.id}`).replace(/[^\w.-]+/g, "_")}.txt`,
          e.content
        );
      }
    }

    const out = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(out);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safelink_bundle_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function runRetention() {
    if (!retDays) return;
    const cutoff = Date.now() - retDays * 24 * 60 * 60 * 1000;
    const expired = safeEvidence.filter((e) => (e.createdAt || 0) < cutoff);
    if (expired.length === 0) return;

    if (retHard) {
      expired.forEach((e) => removeEvidence(e.id));
      toast.show({
        message: `Deleted ${expired.length} item(s) by retention.`,
        variant: "warning",
      });
    } else {
      archiveItems(expired);
      expired.forEach((e) => removeEvidence(e.id));
      setTrash(listArchives());
      toast.show({
        message: `Moved ${expired.length} old item(s) to Recently Deleted.`,
        variant: "warning",
      });
    }
  }

  const empty = filtered.length === 0;
  const selectionActive = sel.size > 0;

  return (
    <section>
      <h2>Evidence Vault</h2>

      {/* Toolbar */}
      <div
        className={`vault-toolbar card ${
          selectionActive ? "with-selection" : ""
        }`}>
        {/* Row 1 — inputs */}
        <div className='toolbar-row top-row'>
          <input
            className='input tb-search'
            placeholder='Search title or content…'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            ref={searchRef}
          />
          <select
            className='input tb-type'
            value={type}
            onChange={(e) => setType(e.target.value)}>
            {typesInVault.map((t) => (
              <option key={t} value={t}>
                {labelForType(t)}
              </option>
            ))}
          </select>
          <select
            className='input tb-sort'
            value={sort}
            onChange={(e) => setSort(e.target.value)}>
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='type'>Type A–Z</option>
          </select>
        </div>

        {/* Row 2 — actions */}
        <div className='actions-row bottom-row'>
          <div className='left-actions'>
            <div className='view-switch' role='tablist' aria-label='View mode'>
              <button
                role='tab'
                aria-selected={view === "grid"}
                className={"btn ghost" + (view === "grid" ? " active" : "")}
                onClick={() => setView("grid")}
                title='Grid view'>
                ▦ Grid
              </button>
              <button
                role='tab'
                aria-selected={view === "list"}
                className={"btn ghost" + (view === "list" ? " active" : "")}
                onClick={() => setView("list")}
                title='List view'>
                ≡ List
              </button>
            </div>
          </div>

          <div className='right-actions'>
            <button className='btn primary' onClick={exportBundle}>
              Export Bundle (ZIP)
            </button>
            <button className='btn' onClick={downloadCsv}>
              Export CSV
            </button>
            <button className='btn ghost' onClick={() => setRetOpen(true)}>
              Retention
            </button>
            <button
              className='btn ghost'
              onClick={() => {
                setShowTrash((v) => !v);
                setTrash(listArchives());
              }}>
              Recently Deleted ({trash.length})
            </button>
            <button
              className='btn ghost'
              onClick={selectAll}
              disabled={filtered.length === 0}
              title='Select all filtered items'>
              Select All
            </button>
            {!locked ? (
              <button
                className='btn'
                onClick={() => {
                  setEncMode("lock");
                  setEncOpen(true);
                }}>
                Lock Vault
              </button>
            ) : (
              <button
                className='btn'
                onClick={() => {
                  setEncMode("unlock");
                  setEncOpen(true);
                }}>
                Unlock Vault
              </button>
            )}
            {safeEvidence.length > 0 && (
              <button
                className='btn danger'
                onClick={() => setConfirmClearOpen(true)}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Selection bar */}
        {selectionActive && (
          <div className='selection-row'>
            <span className='badge'>{sel.size} selected</span>
            <div className='row' style={{ gap: 8 }}>
              <button className='btn ghost' onClick={clearSel}>
                Clear Selection
              </button>
              <button className='btn danger' onClick={bulkSoftDelete}>
                Move to Recently Deleted
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recently Deleted panel */}
      {showTrash && (
        <div className='card trash-panel'>
          <div
            className='row'
            style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Recently Deleted</h3>
            <div className='row' style={{ gap: 8 }}>
              <button
                className='btn ghost'
                onClick={() => {
                  purgeExpired();
                  setTrash(listArchives());
                }}>
                Refresh
              </button>
              {trash.length > 0 && (
                <button
                  className='btn danger'
                  onClick={() => {
                    purgeArchive();
                    setTrash(listArchives());
                  }}>
                  Empty Now
                </button>
              )}
            </div>
          </div>

          {trash.length === 0 ? (
            <p className='muted' style={{ marginTop: 8 }}>
              Nothing here. Items appear for 10 minutes after deletion.
            </p>
          ) : (
            <ul className='trash-list'>
              {trash.map((t) => {
                const ms = msRemaining(t.archivedAt);
                return (
                  <li key={t.id} className='trash-row'>
                    <div className='trash-main'>
                      <div className='trash-title clamp-1'>
                        {t.item.title || "(Untitled)"}{" "}
                        <span className='muted'>
                          • {labelForType(t.item.type || "note")}
                        </span>
                      </div>
                      <div className='muted small'>
                        Deleted: {new Date(t.archivedAt).toLocaleString()} •{" "}
                        <b>Auto-purge in {formatCountdown(ms)}</b>
                      </div>
                    </div>
                    <div className='trash-actions'>
                      <button
                        className='btn'
                        onClick={() => {
                          const item = restoreArchive(t.id);
                          if (item) addEvidence(item);
                          setTrash(listArchives());
                          toast.show({
                            message: "Item restored.",
                            duration: 3000,
                            variant: "success",
                          });
                        }}>
                        Restore
                      </button>
                      <button
                        className='btn danger'
                        onClick={() => {
                          purgeArchive([t.id]);
                          setTrash(listArchives());
                          toast.show({
                            message: "Item deleted permanently.",
                            duration: 3000,
                            variant: "error",
                          });
                        }}>
                        Delete now
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Items */}
      {empty ? (
        <EmptyState />
      ) : view === "grid" ? (
        <div className='vault-grid'>
          {filtered.map((item) => (
            <Card
              key={item.id}
              item={item}
              selected={sel.has(item.id)}
              onToggleSel={() => toggleSel(item.id)}
              onOpen={() => setPreview(item)}
              onDelete={() => softDeleteOne(item)}
            />
          ))}
        </div>
      ) : (
        <div className='vault-list' role='table' aria-label='Evidence list'>
          <div className='vault-list-head' role='row'>
            <div role='columnheader'>Title</div>
            <div role='columnheader' className='hide-sm'>
              Type
            </div>
            <div role='columnheader'>Added</div>
            <div role='columnheader' className='hide-sm'>
              Risk
            </div>
            <div role='columnheader' aria-hidden />
          </div>
          {filtered.map((item) => (
            <ListRow
              key={item.id}
              item={item}
              selected={sel.has(item.id)}
              onToggleSel={() => toggleSel(item.id)}
              onOpen={() => setPreview(item)}
              onDelete={() => softDeleteOne(item)}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size='md'
        labelledBy='ev-title'>
        {preview && <Preview item={preview} onClose={() => setPreview(null)} />}
      </Modal>

      {/* Clear All modal */}
      <ConfirmClearAllModal
        open={confirmClearOpen}
        count={safeEvidence.length}
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={(mode) => {
          if (mode === "archive") {
            archiveItems(safeEvidence);
            clearEvidence();
            setTrash(listArchives());
            toast.show({
              message: "All items moved to Recently Deleted.",
              duration: 5000,
              variant: "warning",
            });
          } else {
            clearEvidence();
            purgeArchive(); // also empty trash
            toast.show({
              message: "All items deleted permanently.",
              duration: 5000,
              variant: "error",
            });
          }
          setSel(new Set());
          setConfirmClearOpen(false);
        }}
      />

      {/* Encryption modal */}
      <EncryptionModal
        open={encOpen}
        mode={encMode}
        count={safeEvidence.length}
        onCancel={() => setEncOpen(false)}
        onSubmit={async (pass) => {
          if (encMode === "lock") {
            const pkg = await encryptJSON(safeEvidence, pass);
            localStorage.setItem("vault_ct", JSON.stringify(pkg));
            clearEvidence();
            toast.show({ message: "Vault locked.", variant: "success" });
          } else {
            try {
              const raw = localStorage.getItem("vault_ct") || "{}";
              const pkg = JSON.parse(raw);
              const arr = await decryptJSON(pkg, pass);
              clearEvidence();
              arr.forEach((it) => addEvidence(it));
              localStorage.removeItem("vault_ct");
              toast.show({ message: "Vault unlocked.", variant: "success" });
            } catch {
              toast.show({ message: "Invalid passphrase.", variant: "error" });
            }
          }
          setEncOpen(false);
        }}
      />

      {/* Image Redactor */}
      <ImageRedactor
        open={redactOpen}
        item={redactItem}
        onCancel={() => {
          setRedactOpen(false);
          setRedactItem(null);
        }}
        onSave={({ blob, dataUrl, mode }) => {
          const url = URL.createObjectURL(blob);
          if (mode === "replace") {
            removeEvidence(redactItem.id);
            addEvidence({
              ...redactItem,
              metadata: {
                ...(redactItem.metadata || {}),
                blobUrl: url,
                dataUrl,
                redacted: true,
              },
              updatedAt: Date.now(),
            });
            toast.show({
              message: "Image redacted (replaced).",
              variant: "success",
            });
          } else {
            addEvidence({
              id: nanoid(),
              type: "image",
              title: `${redactItem.title || "image"} (redacted)`,
              content: "",
              createdAt: Date.now(),
              metadata: {
                blobUrl: url,
                dataUrl,
                redacted: true,
                sourceId: redactItem.id,
              },
            });
            toast.show({ message: "Redacted copy saved.", variant: "success" });
          }
          setRedactOpen(false);
          setRedactItem(null);
        }}
      />

      {/* Retention modal */}
      <RetentionModal
        open={retOpen}
        valueDays={retDays}
        hardDelete={retHard}
        onCancel={() => setRetOpen(false)}
        onSave={({ days, hard }) => {
          setRetDays(days);
          setRetHard(hard);
          localStorage.setItem("retention_days", String(days || 0));
          localStorage.setItem("retention_hard", hard ? "1" : "0");
          setRetOpen(false);
          runRetention();
        }}
      />
    </section>
  );
}

/* ==== List row (list view) ==== */
function ListRow({ item, selected, onToggleSel, onOpen, onDelete }) {
  const t = item.type || "note";
  const risk = item.metadata?.risk;
  return (
    <div className='vault-list-row' role='row'>
      <div
        className='cell title'
        role='cell'
        title={item.title || "(Untitled)"}>
        <label className='tick'>
          <input
            type='checkbox'
            checked={selected}
            onChange={onToggleSel}
            aria-label='Select item'
          />
        </label>
        <span className='clamp-1'>{item.title || "(Untitled)"}</span>
      </div>
      <div className='cell hide-sm' role='cell'>
        <span className={`type-pill ${t}`}>{labelForType(t)}</span>
      </div>
      <div className='cell' role='cell'>
        <span className='muted small'>
          {new Date(item.createdAt || 0).toLocaleString()}
        </span>
      </div>
      <div className='cell hide-sm' role='cell'>
        {risk && (
          <RiskIndicator
            score={risk.score}
            level={risk.level}
            variant='compact'
          />
        )}
      </div>
      <div className='cell actions' role='cell'>
        {t === "image" && (
          <button
            className='btn ghost'
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-redactor", { detail: item })
              )
            }>
            Redact
          </button>
        )}
        {item.content?.length ? (
          <button
            className='btn ghost'
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.content);
              } catch {}
            }}>
            Copy
          </button>
        ) : null}
        <button className='btn' onClick={onOpen}>
          Preview
        </button>
        <button className='btn danger' onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

/* ==== Card / Preview / helpers ==== */

function Card({ item, selected, onToggleSel, onOpen, onDelete }) {
  const t = item.type || "note";
  const risk = item.metadata?.risk;
  return (
    <article className='ev-card'>
      <div className='ev-card-top'>
        <span className={`type-pill ${t}`}>
          {typeIcon(t)} {labelForType(t)}
        </span>
        <label className='tick'>
          <input
            type='checkbox'
            checked={selected}
            onChange={onToggleSel}
            aria-label='Select item'
          />
        </label>
      </div>
      <h3 className='ev-title clamp-2' title={item.title || "(Untitled)"}>
        {item.title || "(Untitled)"}
      </h3>
      <Thumb item={item} h={140} />
      <p className='ev-summary clamp-3'>
        {(item.content || "").replace(/\s+/g, " ").trim() || "(no content)"}
      </p>
      <div className='ev-foot'>
        <div className='ev-meta'>
          <span className='muted'>
            {new Date(item.createdAt || 0).toLocaleString()}
          </span>
          {risk && (
            <RiskIndicator
              score={risk.score}
              level={risk.level}
              variant='compact'
            />
          )}
        </div>
        <div className='ev-actions'>
          {t === "image" && (
            <button
              className='btn ghost'
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-redactor", { detail: item })
                )
              }>
              Redact
            </button>
          )}
          {item.content?.length ? (
            <button
              className='btn ghost'
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(item.content);
                } catch {}
              }}
              title='Copy text'>
              Copy
            </button>
          ) : null}
          <button className='btn' onClick={onOpen}>
            Preview
          </button>
          <button className='btn danger' onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function Preview({ item, onClose }) {
  const t = item.type || "note";
  const risk = item.metadata?.risk;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.content || "");
    } catch {}
  };

  return (
    <div>
      <div className='modal-head'>
        <h3 id='ev-title' className='modal-title'>
          {item.title || "(Untitled)"}
        </h3>
        <button
          className='btn modal-close'
          onClick={onClose}
          aria-label='Close'>
          Close
        </button>
      </div>
      <div className='row' style={{ gap: 10, flexWrap: "wrap" }}>
        <span className={`type-pill ${t}`}>
          {typeIcon(t)} {labelForType(t)}
        </span>
        <span className='badge'>
          {new Date(item.createdAt || 0).toLocaleString()}
        </span>
        {risk && (
          <RiskIndicator
            score={risk.score}
            level={risk.level}
            variant='compact'
          />
        )}
      </div>
      <pre style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
        {item.content || ""}
      </pre>
      <div
        className='row'
        style={{ justifyContent: "flex-end", marginTop: 12 }}>
        {(t === "note" || t === "scan") && (
          <button className='btn' onClick={copy}>
            Copy text
          </button>
        )}
        <button className='btn' onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function labelForType(t) {
  if (t === "scan") return "Scan result";
  if (t === "note") return "Note";
  if (t === "image") return "Image";
  if (t === "link") return "Link";
  if (t === "pdf") return "PDF";
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function typeIcon(t) {
  const s = { width: 16, height: 16, verticalAlign: "-2px" };
  if (t === "note")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path
          fill='#a9b2d0'
          d='M7 3h10a2 2 0 012 2v9l-6 6H7a2 2 0 01-2-2V5a2 2 0 012-2zm8 13h4l-4 4v-4z'
        />
      </svg>
    );
  if (t === "scan")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path fill='#a9b2d0' d='M4 4h16v2H4zm0 14h16v2H4z' />
        <rect x='6' y='8' width='12' height='8' rx='2' fill='#a9b2d0' />
      </svg>
    );
  if (t === "image")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <rect x='3' y='5' width='18' height='14' rx='2' fill='#a9b2d0' />
        <circle cx='9' cy='10' r='2' fill='#0b0d20' />
        <path
          d='M7 17l4-4 3 3 3-3 3 3'
          stroke='#0b0d20'
          strokeWidth='1.5'
          fill='none'
        />
      </svg>
    );
  if (t === "link")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path
          d='M10 7h7a3 3 0 0 1 0 6h-3'
          stroke='#a9b2d0'
          strokeWidth='1.8'
          fill='none'
        />
        <path
          d='M14 17H7a3 3 0 1 1 0-6h3'
          stroke='#a9b2d0'
          strokeWidth='1.8'
          fill='none'
        />
      </svg>
    );
  if (t === "pdf")
    return (
      <svg viewBox='0 0 24 24' style={s}>
        <path
          d='M6 3h9l5 5v13a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'
          fill='#a9b2d0'
        />
        <path d='M15 3v5h5' fill='#0b0d20' />
      </svg>
    );
  return (
    <svg viewBox='0 0 24 24' style={s}>
      <circle cx='12' cy='12' r='9' fill='#a9b2d0' />
    </svg>
  );
}

/* ==== Empty state ==== */
function EmptyState() {
  return (
    <div className='card' style={{ textAlign: "center", padding: 24 }}>
      <div style={{ opacity: 0.9, marginBottom: 8 }}>
        <svg width='48' height='48' viewBox='0 0 24 24' aria-hidden='true'>
          <path
            fill='#a9b2d0'
            d='M7 3h10a2 2 0 012 2v9l-6 6H7a2 2 0 01-2-2V5a2 2 0 012-2zm8 13h4l-4 4v-4z'
          />
        </svg>
      </div>
      <h3 style={{ margin: "6px 0 4px" }}>No evidence yet</h3>
      <p className='muted' style={{ margin: 0 }}>
        Add items from the scanner or upload screenshots to start building your
        vault.
      </p>
      <div
        className='row'
        style={{ justifyContent: "center", gap: 8, marginTop: 12 }}>
        <a className='btn' href='/'>
          Open Scanner
        </a>
        <a className='btn ghost' href='/report'>
          Start a Report
        </a>
      </div>
    </div>
  );
}
