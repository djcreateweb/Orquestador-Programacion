// Toast.jsx — Aviso efímero (auto-descarta). Incluye el hook `useToast` para
// que los contenedores gestionen el estado sin lógica repetida.
import React, { useState, useCallback, useEffect } from "react";

/**
 * Hook de conveniencia para mostrar toasts.
 * @returns {{ toast:object|null, mostrar:Function, ocultar:Function }}
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const mostrar = useCallback((mensaje, tipo = "exito", hora = null) => {
    setToast({ mensaje, tipo, hora, id: Date.now() });
  }, []);
  const ocultar = useCallback(() => setToast(null), []);
  return { toast, mostrar, ocultar };
}

/**
 * @param {object} props
 * @param {{mensaje:string, tipo?:string, hora?:string, id?:number}|null} props.toast
 * @param {Function} props.onClose
 * @param {number} [props.duracion=3500]
 */
export default function Toast({ toast, onClose, duracion = 3500 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onClose && onClose(), duracion);
    return () => clearTimeout(t);
  }, [toast, duracion, onClose]);

  if (!toast) return null;
  const tipo = toast.tipo || "info";
  return (
    <div className="px-toast-zona" role="status" aria-live="polite">
      <div className={`px-toast px-toast--${tipo}`}>
        <span>{toast.mensaje}</span>
        {toast.hora ? <span className="px-toast__hora">{toast.hora}</span> : null}
      </div>
    </div>
  );
}
