// src/components/ui/ToastProvider.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const ToastCtx = createContext({ show: () => {}, remove: () => {} });
export function useToast() {
  return useContext(ToastCtx);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // {id, message, actionLabel, onAction, expiresAt, variant}
  const idRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setToasts((list) => list.filter((t) => t.expiresAt > Date.now()));
    }, 300);
    return () => clearInterval(t);
  }, []);

  const remove = useCallback(
    (id) => setToasts((list) => list.filter((t) => t.id !== id)),
    []
  );

  const show = useCallback(
    ({ message, actionLabel, onAction, duration = 5000, variant = "info" }) => {
      const id = ++idRef.current;
      setToasts((list) => [
        ...list,
        {
          id,
          message,
          actionLabel,
          onAction,
          expiresAt: Date.now() + duration,
          variant,
        },
      ]);
      return id;
    },
    []
  );

  const value = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div
          className='toast-container'
          role='region'
          aria-label='Notifications'>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              variant={t.variant}
              actionLabel={t.actionLabel}
              onAction={() => {
                t.onAction?.();
                remove(t.id);
              }}
              onClose={() => remove(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

function Toast({ message, variant = "info", actionLabel, onAction, onClose }) {
  // warning/error use assertive for urgency; others polite
  const live =
    variant === "warning" || variant === "error" ? "assertive" : "polite";
  return (
    <div className={`toast ${variant}`} role='status' aria-live={live}>
      <span className='toast-msg'>{message}</span>
      <div className='toast-actions'>
        {actionLabel && (
          <button className='btn ghost' onClick={onAction}>
            {actionLabel}
          </button>
        )}
        <button className='btn ghost' aria-label='Dismiss' onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
