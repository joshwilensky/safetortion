import { useEffect, useMemo, useRef, useState } from "react";
import { PLATFORMS, platformById } from "../data/platforms.js";
import PlatformIcon from "./PlatformIcon.jsx";

export default function PlatformSelect({
  value,
  onChange,
  label = "Platform",
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => platformById(value), [value]);
  const items = PLATFORMS;

  useEffect(() => {
    const idx = Math.max(
      0,
      items.findIndex((p) => p.id === value)
    );
    setActiveIdx(idx);
  }, [value, items]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!btnRef.current) return;
      const pop = listRef.current;
      if (btnRef.current.contains(e.target) || (pop && pop.contains(e.target)))
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (idx) => {
    const item = items[idx];
    if (!item) return;
    onChange?.(item.id);
    setOpen(false);
    // restore focus to trigger
    requestAnimationFrame(() => btnRef.current?.focus());
  };

  const onTriggerKey = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        // move focus into list
        listRef.current?.focus();
      });
    }
  };

  const onListKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(items.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(items.length - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commit(activeIdx);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
    } // let focus move on
  };

  return (
    <div className='select'>
      <div style={{ marginBottom: 6 }}>{label}</div>

      <button
        type='button'
        className='select-trigger input'
        ref={btnRef}
        aria-haspopup='listbox'
        aria-expanded={open ? "true" : "false"}
        aria-label='Choose platform'
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}>
        <span className='select-value'>
          <PlatformIcon id={selected.id} color={selected.color} />
          <span className='select-text' style={{ color: selected.color }}>
            {selected.name}
          </span>
        </span>
        <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
          <path d='M6 9l6 6 6-6' fill='none' stroke='#a9b2d0' strokeWidth='2' />
        </svg>
      </button>

      {open && (
        <div className='select-popover'>
          <ul
            className='select-list'
            role='listbox'
            tabIndex={0}
            ref={listRef}
            aria-activedescendant={`plat-${items[activeIdx]?.id}`}
            onKeyDown={onListKey}>
            {items.map((p, i) => (
              <li
                key={p.id}
                id={`plat-${p.id}`}
                role='option'
                aria-selected={p.id === selected.id}
                className={`select-option ${i === activeIdx ? "active" : ""} ${
                  p.id === selected.id ? "selected" : ""
                }`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => commit(i)}>
                <PlatformIcon id={p.id} color={p.color} />
                <span className='label' style={{ color: p.color }}>
                  {p.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
