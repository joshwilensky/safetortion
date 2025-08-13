import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "../data/countries.js";
import CountryFlag from "./CountryFlag.jsx";

const PINNED = "United States";

export default function CountrySelect({
  value,
  onChange,
  label = "Your country",
  placeholder = "Start typing a country…",
  maxItems = 12,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef(null);
  const listId = "country-listbox";

  // keep input text in sync when external value changes or popover closes
  useEffect(() => {
    if (!open) setQuery(value || "");
  }, [value, open]);

  // ranked + pinned list
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const all = COUNTRIES.slice();

    // de-dup & sort baseline alpha for stable results
    const unique = Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));

    if (!q) {
      // pin "United States" to top on empty query
      const rest = unique.filter((c) => c !== PINNED);
      return [PINNED, ...rest].slice(0, maxItems);
    }

    // rank startsWith first, then includes; boost pinned if it matches
    const starts = [],
      includes = [];
    for (const c of unique) {
      const lc = c.toLowerCase();
      if (lc.startsWith(q)) starts.push(c);
      else if (lc.includes(q)) includes.push(c);
    }
    let list = [...starts, ...includes];

    // if pinned matches but isn’t first, move it to the front of the matching bucket
    if (list.includes(PINNED)) {
      list = [PINNED, ...list.filter((c) => c !== PINNED)];
    }
    return list.slice(0, maxItems);
  }, [query, maxItems]);

  // keep highlighted index in range
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (country) => {
    onChange?.(country || "");
    setQuery(country || "");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[activeIdx]) {
        e.preventDefault();
        commit(filtered[activeIdx]);
      } else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const highlight = (name) => {
    const q = (query || "").trim();
    if (!q) return name;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + q.length);
    const after = name.slice(idx + q.length);
    return (
      <>
        {before}
        <mark className='combo-mark'>{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className='combo' ref={boxRef}>
      <div style={{ marginBottom: 6 }}>{label}</div>

      <div
        className='combo-field input'
        role='combobox'
        aria-haspopup='listbox'
        aria-expanded={open ? "true" : "false"}
        aria-owns={listId}
        onClick={() => setOpen(true)}>
        <input
          className='combo-input'
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          aria-autocomplete='list'
          aria-controls={listId}
          aria-activedescendant={
            open && filtered[activeIdx] ? `country-${activeIdx}` : undefined
          }
        />

        {/* clear (X) to empty selection */}
        {(value || query) && (
          <button
            type='button'
            className='combo-clear'
            aria-label='Clear'
            onClick={(e) => {
              e.stopPropagation();
              commit("");
            }}
            title='Clear country'>
            ×
          </button>
        )}

        <button
          type='button'
          className='combo-caret'
          aria-label='Toggle'
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          title='Show countries'>
          ▼
        </button>
      </div>

      {open && (
        <ul className='combo-popover' id={listId} role='listbox' tabIndex={-1}>
          {filtered.length === 0 ? (
            <li className='combo-empty'>No matches</li>
          ) : (
            filtered.map((c, i) => (
              <li
                key={c}
                id={`country-${i}`}
                role='option'
                aria-selected={value === c}
                className={`combo-option ${i === activeIdx ? "active" : ""} ${
                  value === c ? "selected" : ""
                }`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(c)}>
                {highlight(c)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
