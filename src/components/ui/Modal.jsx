import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  labelledBy, // id of the <h> element inside the modal
  describedBy, // id of a description element inside the modal
  children,
  size = "md", // "sm" | "md" | "lg"
}) {
  const panelRef = useRef(null);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close + focus trap
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab") trapTab(e);
    };
    document.addEventListener("keydown", onKey, true);
    // focus the panel
    requestAnimationFrame(() => {
      const el = panelRef.current;
      if (el) {
        // try first focusable
        const focusables = getFocusables(el);
        (focusables[0] || el).focus();
      }
    });
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const trapTab = (e) => {
    const root = panelRef.current;
    if (!root) return;
    const f = getFocusables(root);
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === root) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div
      className='modal-overlay'
      onMouseDown={onOverlayClick}
      role='presentation'>
      <div
        ref={panelRef}
        className={`modal-panel ${size}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// helpers
function getFocusables(root) {
  return Array.from(
    root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
  );
}
