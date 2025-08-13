import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, options = {}) => {
    const id = ++idRef.current;
    const duration = options.duration ?? 2000;
    const type = options.type ?? 'info';

    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }

    return id;
  }, [remove]);

  const value = useMemo(() => ({ show }), [show]);

  // Allow global event-based toasts: window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration } }))
  useEffect(() => {
    const handler = (e) => {
      const { message, type, duration } = e.detail || {};
      if (!message) return;
      show(message, { type, duration });
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
