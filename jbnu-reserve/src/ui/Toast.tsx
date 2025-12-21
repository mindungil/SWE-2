import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import "../styles/app.css";

type ToastType = "ok" | "bad" | "info";
type ToastState = { open: boolean; msg: string; type: ToastType };

const ToastCtx = createContext<{ toast: (msg: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<ToastState>({ open: false, msg: "", type: "info" });

  const toast = useCallback((msg: string, type: ToastType = "info") => {
    setT({ open: true, msg, type });
    window.clearTimeout((toast as any)._timer);
    (toast as any)._timer = window.setTimeout(() => setT(s => ({ ...s, open: false })), 2200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {t.open && (
        <div className="toastWrap">
          <div className={`toast ${t.type === "bad" ? "toastBad" : t.type === "ok" ? "toastOk" : ""}`}>
            {t.msg}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
